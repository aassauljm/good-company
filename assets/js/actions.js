import { fetch } from './utils';

let cookie;


export const LOGIN_REQUEST = 'LOGIN_REQUEST';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';

/*
export const UPLOAD_FILE_REQUEST = 'UPLOAD_FILE_REQUEST';
export const UPLOAD_FILE_SUCCESS = 'UPLOAD_FILE_SUCCESS';
export const UPLOAD_FILE_FAILURE = 'UPLOAD_FILE_FAILURE';
*/

export const SET_PASSWORD_REQUEST = 'SET_PASSWORD_REQUEST';
export const SET_PASSWORD_SUCCESS = 'SET_PASSWORD_SUCCESS';
export const SET_PASSWORD_FAILURE = 'SET_PASSWORD_FAILURE';

export const USER_INFO_REQUEST = 'USER_INFO_REQUEST';
export const USER_INFO_SUCCESS = 'USER_INFO_SUCCESS';
export const USER_INFO_FAILURE = 'USER_INFO_FAILURE';

export const RESOURCE_REQUEST = 'RESOURCE_REQUEST';
export const RESOURCE_SUCCESS = 'RESOURCE_SUCCESS';
export const RESOURCE_FAILURE = 'RESOURCE_FAILURE';

export const RESOURCE_CREATE_REQUEST = 'RESOURCE_CREATE_REQUEST';
export const RESOURCE_CREATE_SUCCESS = 'RESOURCE_CREATE_SUCCESS';
export const RESOURCE_CREATE_FAILURE = 'RESOURCE_CREATE_FAILURE';

export const RESOURCE_UPDATE_REQUEST = 'RESOURCE_UPDATE_REQUEST';
export const RESOURCE_UPDATE_SUCCESS = 'RESOURCE_UPDATE_SUCCESS';
export const RESOURCE_UPDATE_FAILURE = 'RESOURCE_UPDATE_FAILURE';

export const RESOURCE_DELETE_REQUEST = 'RESOURCE_DELETE_REQUEST';
export const RESOURCE_DELETE_SUCCESS = 'RESOURCE_DELETE_SUCCESS';
export const RESOURCE_DELETE_FAILURE = 'RESOURCE_DELETE_FAILURE';


export const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
export const HIDE_NOTIFICATION = 'HIDE_NOTIFICATION';


export const LOOKUP_COMPANY_REQUEST = 'LOOKUP_COMPANY_REQUEST';
export const LOOKUP_COMPANYSUCCESS = 'LOOKUP_COMPANY_SUCCESS';
export const LOOKUP_COMPANYFAILURE = 'LOOKUP_COMPANY_FAILURE';

const json_headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

const accept_json_headers = {
    'Accept': 'application/json'
};

export function addNotification(data){
    return {type: ADD_NOTIFICATION, data};
}

export function hideNotification(data){
    return {type: HIDE_NOTIFICATION, data};
}

export function requestLogin(credentials) {
    return {
        types: [LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAILURE],
        callAPI: () => fetch('/auth/local', {
            method: 'POST',
            headers: json_headers,
            credentials: 'same-origin',
            body: JSON.stringify(credentials)
        })
    };
}

export function setPassword(data) {
    return {
        types: [SET_PASSWORD_REQUEST, SET_PASSWORD_SUCCESS, SET_PASSWORD_FAILURE],
        callAPI: () => fetch('/api/set_password', {
            method: 'PUT',
            headers: json_headers,
            credentials: 'same-origin',
            body: JSON.stringify(data)
        })
    };
}

export function requestUserInfo() {
    return {
        types: [USER_INFO_REQUEST, USER_INFO_SUCCESS, USER_INFO_FAILURE],
        callAPI: () => fetch('/api/get_info', {
            headers: json_headers,
            credentials: 'same-origin'
        }),
        shouldCallAPI: (state) => state.login.loggedIn && !state.userInfo._status
    };
}

const urls = {
    'users': '/user',
    'roles': '/role',
    'documents': '/document',
    'companies': '/company'
}

export function requestResource(resource, form) {
    return {
        types: [RESOURCE_REQUEST, RESOURCE_SUCCESS, RESOURCE_FAILURE],
        callAPI: () => fetch('/api' + (urls[resource] || resource), {
            headers: json_headers,
            credentials: 'same-origin'
        }),
        shouldCallAPI: (state) => !state.resources[resource] || !state.resources[resource]._status,
        payload: {key: resource, form: form}
    };
}

export function createResource(resource, data, form, stringify = true) {
    return {
        types: [RESOURCE_CREATE_REQUEST, RESOURCE_CREATE_SUCCESS, RESOURCE_CREATE_FAILURE],
        callAPI: () => fetch('/api' + (urls[resource] || resource), {
            method: 'POST',
            headers: stringify ? json_headers : accept_json_headers,
            body: stringify ? JSON.stringify(data) : data,
            credentials: 'same-origin'
        }),
        payload: {key: resource, form}
    };
}

export function updateResource(resource, data, form) {
    return {
        types: [RESOURCE_UPDATE_REQUEST, RESOURCE_UPDATE_SUCCESS, RESOURCE_UPDATE_FAILURE],
        callAPI: () => fetch('/api' + (urls[resource] || resource), {
            method: 'PUT',
            headers: json_headers,
            body: JSON.stringify(data),
            credentials: 'same-origin'
        }),
        payload: {key: resource, form}
    };
}

export function deleteResource(resource) {
    return {
        types: [RESOURCE_DELETE_REQUEST, RESOURCE_DELETE_SUCCESS, RESOURCE_DELETE_FAILURE],
        callAPI: () => fetch('/api' + (urls[resource] || resource), {
            method: 'DELETE',
            headers: json_headers,
            credentials: 'same-origin'
        }),
        payload: {key: resource}
    };
}

export function lookupCompany(query) {
    return {
        types: [LOOKUP_COMPANY_REQUEST, LOOKUP_COMPANY_SUCCESS, LOOKUP_COMPANY_FAILURE],
        callAPI: () => fetch('/api/company/lookup/' + encodeURIComponent(query), {
            headers: json_headers,
            credentials: 'same-origin'
        }),
        payload: {query: query}
    };
}