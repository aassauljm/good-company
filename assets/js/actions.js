import { fetch } from './utils';
import FormData from 'form-data';
import {
    LOGIN_START, LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAILURE,
    SIGNUP_REQUEST, SIGNUP_SUCCESS, SIGNUP_FAILURE,
    USER_INFO_REQUEST, USER_INFO_SUCCESS, USER_INFO_FAILURE,
    SET_PASSWORD_REQUEST, SET_PASSWORD_SUCCESS, SET_PASSWORD_FAILURE,
    RESOURCE_REQUEST, RESOURCE_SUCCESS, RESOURCE_FAILURE,
    RESOURCE_CREATE_REQUEST, RESOURCE_CREATE_SUCCESS, RESOURCE_CREATE_FAILURE,
    RESOURCE_UPDATE_REQUEST, RESOURCE_UPDATE_SUCCESS, RESOURCE_UPDATE_FAILURE,
    RESOURCE_DELETE_REQUEST, RESOURCE_DELETE_SUCCESS, RESOURCE_DELETE_FAILURE,
    TRANSACTION_REQUEST, TRANSACTION_SUCCESS, TRANSACTION_FAILURE,
    ADD_NOTIFICATION, HIDE_NOTIFICATION,
    LOOKUP_COMPANY_REQUEST, LOOKUP_COMPANY_SUCCESS, LOOKUP_COMPANY_FAILURE,
    LOOKUP_OWN_COMPANY_REQUEST, LOOKUP_OWN_COMPANY_SUCCESS, LOOKUP_OWN_COMPANY_FAILURE,
    LOOKUP_ADDRESS_REQUEST, LOOKUP_ADDRESS_SUCCESS, LOOKUP_ADDRESS_FAILURE,
    IMPORT_COMPANY_REQUEST, IMPORT_COMPANY_SUCCESS, IMPORT_COMPANY_FAILURE,
    VALIDATE_COMPANY_REQUEST, VALIDATE_COMPANY_SUCCESS, VALIDATE_COMPANY_FAILURE,
    VALIDATE_USER_REQUEST, VALIDATE_USER_SUCCESS, VALIDATE_USER_FAILURE,
    COMPANY_TAB_CHANGE,
    START_CREATE_COMPANY, END_CREATE_COMPANY,
    START_IMPORT_COMPANY, END_IMPORT_COMPANY,
    SHOW_MODAL, END_MODAL,
    NEXT_MODAL, PREVIOUS_MODAL,
    UPDATE_MENU,
    TOGGLE_WIDGET_SIZE
     } from './actionTypes';

const json_headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

const accept_json_headers = {
    'Accept': 'application/json'
};

function retryOnError(status){
    return !status || status === 'error';
}

export function loginStart(){
    return {type: LOGIN_START};
}

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
        payload: {key: resource, form: options.form},
        postProcess: options.postProcess
    };
}

export function createResource(resource, data, options = {stringify: true}) {
    if(options && options.stringify === undefined){
        options = {...options, stringify: true}
    }

    return {
        types: [RESOURCE_CREATE_REQUEST, RESOURCE_CREATE_SUCCESS, RESOURCE_CREATE_FAILURE],
        callAPI: () => fetch('/api' + (urls[resource] || resource), {
            method: 'POST',
            headers: (options.stringify && data) ? json_headers : {
                ...accept_json_headers
            },
            body: (options.stringify && data) ? JSON.stringify(data) : data,
            credentials: 'same-origin'
        }),
        payload: {key: resource, form: options.form, invalidateList: options.invalidates}
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
        payload: {key: resource, form: options.form, invalidateList: options.invalidates}

    };
}

export function deleteResource(resource, options = {}) {
    return {
        types: [RESOURCE_DELETE_REQUEST, RESOURCE_DELETE_SUCCESS, RESOURCE_DELETE_FAILURE],
        callAPI: () => fetch('/api' + (urls[resource] || resource), {
            method: 'DELETE',
            headers: json_headers,
            credentials: 'same-origin'
        }),
        payload: {key: resource, invalidateList: options.invalidates}
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

export function lookupOwnCompany(query) {
    return {
        types: [LOOKUP_OWN_COMPANY_REQUEST, LOOKUP_OWN_COMPANY_SUCCESS, LOOKUP_OWN_COMPANY_FAILURE],
        callAPI: () => fetch('/api/company/lookup_own/' + encodeURIComponent(query), {
            headers: json_headers,
            credentials: 'same-origin'
        }),
        payload: {query: query}
    };
}

export function lookupAddress(query) {
    return {
        types: [LOOKUP_ADDRESS_REQUEST, LOOKUP_ADDRESS_SUCCESS, LOOKUP_ADDRESS_FAILURE],
        callAPI: () => fetch('/api/address/lookup/' + encodeURIComponent(query), {
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
    const body = new FormData();
    body.append('json', JSON.stringify({...data, documents: null}));
    (data.documents ||[]).map(d => {
        body.append('documents', d, d.name);
    });
    return {
        types: [TRANSACTION_REQUEST, TRANSACTION_SUCCESS, TRANSACTION_FAILURE],
        callAPI: () => fetch('/api/transaction/'+transactionType+'/' +companyId, {
            method: 'POST',
            headers: accept_json_headers,
            body: body,
            credentials: 'same-origin'
        }),
        shouldCallAPI: (state) => state.transactions._status !== 'fetching',
        payload: {companyId: companyId}
    };
}


export function startCreateCompany(formKey, data){
    return {
        type: START_CREATE_COMPANY, formKey, data
    }
}

export function endCreateCompany(formKey){
    return {
        type: END_CREATE_COMPANY, formKey
    }
}

export function startImportCompany(formKey, data){
    return {
        type: START_IMPORT_COMPANY, formKey, data
    }
}

export function endImportCompany(formKey){
    return {
        type: END_IMPORT_COMPANY, formKey
    }
}

export function showModal(modal, data){
    return {
        type: SHOW_MODAL, modal, data
    }
}

export function endModal(modal, data={}){
    return {
        type: END_MODAL, modal, data
    }
}

export function nextModal(modal, data){
    return {
        type: NEXT_MODAL, modal, data
    }
}

export function previousModal(modal){
    return {
        type: PREVIOUS_MODAL, modal
    }
}

export function updateMenu(menu, data){
    return {
        type: UPDATE_MENU, menu, data
    }
}

export function toggleWidget(path, value){
    return {
        type: TOGGLE_WIDGET_SIZE, path, value
    }
}


