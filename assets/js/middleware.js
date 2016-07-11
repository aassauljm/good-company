"use strict";
import Promise from 'bluebird';
import { logout } from './actions';
import { push } from 'react-router-redux'

function checkStatus(response) {
  if (response.status >= 200 && response.status <= 304) {
    return response
  } else {
    var error = new Error(response.statusText)
    error.response = response
    throw error
  }
}

function parseJSON(response) {
  return response.text().then(function(text) {
    return text ? JSON.parse(text) : {}
  })
}

export function callAPIMiddleware({
    dispatch, getState
}) {
    return next => {

        return action => {
            const {
                types,
                callAPI,
                shouldCallAPI = () => true,
                payload = {},
                postProcess,
            } = action;

            if (!types || !callAPI) {
                // Normal action: pass it on
                return next(action);
            }
            if (!Array.isArray(types) ||
                types.length !== 3 ||
                !types.every(type => typeof type === 'string')
            ) {
                throw new Error('Expected an array of three string types.');
            }
            if (typeof callAPI !== 'function') {
                throw new Error('Expected fetch to be a function.');
            }
            if (!shouldCallAPI(getState())) {
                return Promise.resolve({'shouldCallRejected': true});
            }

            const [requestType, successType, failureType] = types;

            dispatch(Object.assign({}, payload, {
                type: requestType
            }));
            return callAPI()
                .then(checkStatus)
                .then(parseJSON)
                .then(response => postProcess ? postProcess(response) : response)
                .then(response => dispatch(Object.assign({}, payload, {
                    response: response,
                    type: successType
                })))
                .catch(error => {
                    if(error.response.status === 403){
                        dispatch(logout());
                        dispatch(push('/login'))
                        return;
                    }
                    if(error.response){
                        return parseJSON(error.response)
                        .then(response => {
                               dispatch(Object.assign({}, payload, {
                            response: response,
                            error: true,
                            type: failureType}));
                            throw new Error((response || {}).message);
                        })
                    }
                    dispatch(Object.assign({}, payload, {
                        error: error,
                        response: error.response,
                        type: failureType
                    }));
                    throw new Error(error.message);
                });
        };
    };
}
