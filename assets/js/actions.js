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

export const TRANSATION_REQUEST = 'TRANSATION_REQUEST';
export const TRANSATION_SUCCESS = 'TRANSATION_SUCCESS';
export const TRANSATION_FAILURE = 'TRANSATION_FAILURE';

export const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
export const HIDE_NOTIFICATION = 'HIDE_NOTIFICATION';


export const LOOKUP_COMPANY_REQUEST = 'LOOKUP_COMPANY_REQUEST';
export const LOOKUP_COMPANY_SUCCESS = 'LOOKUP_COMPANY_SUCCESS';
export const LOOKUP_COMPANY_FAILURE = 'LOOKUP_COMPANY_FAILURE';

export const IMPORT_COMPANY_REQUEST = 'IMPORT_COMPANY_REQUEST';
export const IMPORT_COMPANY_SUCCESS = 'IMPORT_COMPANY_SUCCESS';
export const IMPORT_COMPANY_FAILURE = 'IMPORT_COMPANY_FAILURE';

export const VALIDATE_COMPANY_REQUEST = 'VALIDATE_COMPANY_REQUEST';
export const VALIDATE_COMPANY_SUCCESS = 'VALIDATE_COMPANY_SUCCESS';
export const VALIDATE_COMPANY_FAILURE = 'VALIDATE_COMPANY_FAILURE';

export const VALIDATE_USER_REQUEST = 'VALIDATE_USER_REQUEST';
export const VALIDATE_USER_SUCCESS = 'VALIDATE_USER_SUCCESS';
export const VALIDATE_USER_FAILURE = 'VALIDATE_USER_FAILURE';


export const COMPANY_TAB_CHANGE = 'COMPANY_TAB_CHANGE';

export const START_CREATE_COMPANY = 'START_CREATE_COMPANY';
export const END_CREATE_COMPANY = 'END_CREATE_COMPANY';
export const NEXT_MODAL = 'NEXT_MODAL';
export const PREVIOUS_MODAL = 'PREVIOUS_MODAL';

export const REMOVE_LIST_ENTRY= 'REMOVE_LIST_ENTRY';
export const ADD_LIST_ENTRY= 'ADD_LIST_ENTRY';


const json_headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

const accept_json_headers = {
    'Accept': 'application/json'
};

export function changeCompanyTab(tabIndex){
    return {type: COMPANY_TAB_CHANGE, tabIndex};
}

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

export function requestResource(resource, options = {}) {
    return {
        types: [RESOURCE_REQUEST, RESOURCE_SUCCESS, RESOURCE_FAILURE],
        callAPI: () => fetch('/api' + (urls[resource] || resource), {
            headers: json_headers,
            credentials: 'same-origin'
        }),
        shouldCallAPI: (state) => !state.resources[resource] || !state.resources[resource]._status || options.refresh,
        payload: {key: resource, form: options.form}
    };
}

export function createResource(resource, data, options = {}, stringify = true) {
    return {
        types: [RESOURCE_CREATE_REQUEST, RESOURCE_CREATE_SUCCESS, RESOURCE_CREATE_FAILURE],
        callAPI: () => fetch('/api' + (urls[resource] || resource), {
            method: 'POST',
            headers: stringify ? json_headers : accept_json_headers,
            body: stringify ? JSON.stringify(data) : data,
            credentials: 'same-origin'
        }),
        payload: {key: resource, form: options.form}
    };
}

export function updateResource(resource, data, options = {}) {
    return {
        types: [RESOURCE_UPDATE_REQUEST, RESOURCE_UPDATE_SUCCESS, RESOURCE_UPDATE_FAILURE],
        callAPI: () => fetch('/api' + (urls[resource] || resource), {
            method: 'PUT',
            headers: json_headers,
            body: JSON.stringify(data),
            credentials: 'same-origin'
        }),
        payload: {key: resource, form: options.form}
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

export function validateCompany(data, options = {}) {
    return {
        types: [VALIDATE_COMPANY_REQUEST, VALIDATE_COMPANY_SUCCESS, VALIDATE_COMPANY_FAILURE],
        callAPI: () => fetch('/api/company/import/validate', {
            method: 'POST',
            headers: json_headers,
            body: JSON.stringify(data),
            credentials: 'same-origin'
        }),
        payload: {form: options.form}
    };
}



export function validateUser(data, options = {}) {
    return {
        types: [VALIDATE_USER_REQUEST, VALIDATE_USER_SUCCESS, VALIDATE_USER_FAILURE],
        callAPI: () => fetch('/api/user/validate', {
            method: 'POST',
            headers: json_headers,
            body: JSON.stringify(data),
            credentials: 'same-origin'
        }),
        payload: {form: options.form}
    };
}

export function importCompany(companyNumber) {
    return {
        types: [IMPORT_COMPANY_REQUEST, IMPORT_COMPANY_SUCCESS, IMPORT_COMPANY_FAILURE],
        callAPI: () => fetch('/api/company/import/companiesoffice/' + companyNumber, {
            method: 'POST',
            headers: json_headers,
            credentials: 'same-origin'

        }),
        shouldCallAPI: (state) => state.importCompany._status !== 'fetching',
        payload: {companyNumber: companyNumber}
    };
}

export function companyTransaction(transactionType, companyId, data) {
    return {
        types: [IMPORT_COMPANY_REQUEST, IMPORT_COMPANY_SUCCESS, IMPORT_COMPANY_FAILURE],
        callAPI: () => fetch('/api/transaction/'+transactionType+'/' +companyId, {
            method: 'POST',
            headers: json_headers,
            body: JSON.stringify(data),
            credentials: 'same-origin'

        }),
        shouldCallAPI: (state) => state.transactions._status !== 'fetching',
        payload: {companyId: companyId}
    };
}


export function startCreateCompany(formKey){
    return {
        type: START_CREATE_COMPANY, formKey
    }
}

export function endCreateCompany(){
    return {
        type: END_CREATE_COMPANY
    }
}

export function nextModal(modal){
    return {
        type: NEXT_MODAL, modal
    }
}

export function previousModal(modal){
    return {
        type: PREVIOUS_MODAL, modal
    }
}

export function addListEntry(form, ...path){
    return {
        type: ADD_LIST_ENTRY, form, path
    }
}

export function removeListEntry(form, ...path){
    return {
        type: REMOVE_LIST_ENTRY, form, path
    }
}