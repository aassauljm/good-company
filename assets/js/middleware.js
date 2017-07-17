"use strict";
import Promise from 'bluebird';
import { logout, showConfirmation, showIsLoggedOut } from './actions';
import { push } from 'react-router-redux';

Promise.config({
    cancellation: true
});


export function checkStatus(response) {
  if (response.status >= 200 && response.status <= 304) {
    return response
  } else {
    var error = new Error(response.statusText)
    error.response = response
    throw error
  }
}

export function parse(response) {
    if(response.headers.get('Content-Type').indexOf('application/json') === 0){
        return response.text().then(function(text) {
            return text ? JSON.parse(text) : text;
          })
    }
    return Promise.resolve(response);
}


let resolutionId = 0, resolutionMap={};

export function confirmationMiddleware({
    dispatch, getState
}) {
    return next => {
        return action => {
            if(action._confirmation){
                const deferred = resolutionMap[action._confirmation.resolutionId];
                if(!deferred){
                    return
                }
                delete resolutionMap[action._confirmation.resolutionId];
                if(action._confirmation.resolve){
                    return next(action)
                        .then(deferred.resolve)
                        .catch(deferred.reject);
                }
                else if(action._confirmation.reject){
                    return deferred.reject();
                }
                else{
                    return deferred.cancel();
                }
            }
            if(action.confirmation){
                const id = resolutionId++;
                dispatch(showConfirmation({
                    ...action.confirmation,
                    resolveAction: {...action, requiresConfirmation: false, _confirmation: {resolutionId: id, resolve: true}},
                    rejectAction: {requiresConfirmation: false, _confirmation: {resolutionId: id, reject: true}},
                    cancelAction: {_confirmation: {resolutionId: id, cancel: true}}
                }));
                const p = new Promise((resolve, reject) => {
                    resolutionMap[id] = {...resolutionMap[id], resolve, reject};
                });

                resolutionMap[id] = {...resolutionMap[id], cancel: p.cancel.bind(p)};
                return p
            }
            else{
                return next(action);
            }

        }
    }
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
                rejectPayload = () => ({}),
                payload = {},
                postProcess,
                meta
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
                return Promise.resolve({'shouldCallRejected': true, ...rejectPayload(getState())});
            }

            const [requestType, successType, failureType] = types;

            dispatch(Object.assign({}, payload, {
                type: requestType
            }));
            return callAPI()
                .then(checkStatus)
                .then(parse)
                .then(response => postProcess ? postProcess(response) : response)
                .then(response => dispatch(Object.assign({}, payload, {meta: meta}, {
                    response: response,
                    type: successType
                })))
                .catch(error => {
                    if(error.response && error.response.status === 503){
                        !USER_WARNED && setTimeout(() => alert('Good Companies is currently undergoing maintenance.  Please try again in a few moments.'), 0);
                        USER_WARNED = true;
                        throw new Error('Currently undergoing Maintenance');
                        return;
                    }

                    if(error.response){
                        return parse(error.response)
                        .then(response => {
                            const isLoggedIn =  getState().login.loggedIn;
                            if(error.response.status === 403 && response.isAuthenticated === false && isLoggedIn){
                                dispatch(logout());
                                dispatch(showIsLoggedOut());
                            }
                           dispatch(Object.assign({}, payload, {meta: meta}, {
                                response: response,
                                error: true,
                                type: failureType}));
                                throw new Error((response || {}).message);
                            })
                    }
                    dispatch(Object.assign({}, payload, {meta: meta}, {
                        error: error,
                        response: error.response,
                        type: failureType
                    }));
                    throw new Error(error.message);
                });
        };
    };
}
