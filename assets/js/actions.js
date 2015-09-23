import fetch from 'isomorphic-fetch';

export const LOGIN_REQUEST = 'LOGIN_REQUEST';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';

export const USER_INFO_REQUEST = 'USER_INFO_REQUEST';
export const USER_INFO_SUCCESS = 'USER_INFO_SUCCESS';
export const USER_INFO_FAILURE = 'USER_INFO_FAILURE';

export const RESOURCE_REQUEST = 'RESOURCE_REQUEST';
export const RESOURCE_SUCCESS = 'RESOURCE_SUCCESS';
export const RESOURCE_FAILURE = 'RESOURCE_FAILURE';


export function requestLogin(credentials) {
    return {
        types: [LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAILURE],
        callAPI: () => fetch('/auth/local', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify(credentials)
        })
    };
}

export function requestUserInfo() {
    return {
        types: [USER_INFO_REQUEST, USER_INFO_SUCCESS, USER_INFO_FAILURE],
        callAPI: () => fetch('/get_info', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        }),
        shouldCallAPI: (state) => state.login.loggedIn && !state.userInfo.status
    };
}

export function requestResource(resource) {
    let urls = {
        'users': '/user'
    }
    return {
        types: [RESOURCE_REQUEST, RESOURCE_SUCCESS, RESOURCE_FAILURE],
        callAPI: () => fetch(urls[resource], {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        }),
        shouldCallAPI: (state) => !state.resources[resource].status
    };
}