"use strict";
import Promise from 'bluebird';
import { logout, showConfirmation } from './actions';
import { push } from 'react-router-redux';
import Raven from 'raven-js';

Promise.config({
    cancellation: true
});


// So when we log errors, we can grab the current state from the window
export const addStateToWindow = store => next => action => {
    const debloatState = (state) => {
        return {
            ..state,
            resources: Object.keys(state.resources).reduce((acc, key) => {
                    acc[key] = { ...state.resources[key], data: null };
                    return acc;
                }, {})
        };
    };

    ['routing', 'version', 'userInfo', 'form']``

    const state = debloatState(store.getState());

    window.getState = () => state; // So UserFeedback can get the most recent state
    Raven.setExtraContext({ state });

    return next(action);
};

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
    return response;
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

let USER_WARNED = false;

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
                .then(response => dispatch(Object.assign({}, payload, {
                    response: response,
                    type: successType
                })))
                .catch(error => {
                    if(error.response && error.response.status === 403){
                        dispatch(logout());
                        // out redirect or something
                        const state = getState();
                        if(state.routing.locationBeforeTransitions.pathname !== '/login'){
                            dispatch(push({pathname: '/login', query: {next: state.routing.locationBeforeTransitions.pathname}}))
                        }
                        return;
                    }
                    if(error.response && error.response.status === 503){
                        !USER_WARNED && setTimeout(() => alert('Good Companies is currently undergoing maintenance.  Please try again in a few moments.'), 0);
                        USER_WARNED = true;
                        throw new Error('Currently undergoing Maintenance');
                        return;
                    }

                    if(error.response){
                        return parse(error.response)
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
