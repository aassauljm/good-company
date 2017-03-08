import { fetch } from './utils';
import FormData from 'form-data';
import {
    LOGIN_START, LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT,
    SIGNUP_REQUEST, SIGNUP_SUCCESS, SIGNUP_FAILURE,
    USER_INFO_REQUEST, USER_INFO_SUCCESS, USER_INFO_FAILURE,
    SET_PASSWORD_REQUEST, SET_PASSWORD_SUCCESS, SET_PASSWORD_FAILURE,
    RESOURCE_REQUEST, RESOURCE_SUCCESS, RESOURCE_FAILURE,
    RESOURCE_RESET,
    RESOURCE_CREATE_REQUEST, RESOURCE_CREATE_SUCCESS, RESOURCE_CREATE_FAILURE,
    RESOURCE_UPDATE_REQUEST, RESOURCE_UPDATE_SUCCESS, RESOURCE_UPDATE_FAILURE,
    RESOURCE_DELETE_REQUEST, RESOURCE_DELETE_SUCCESS, RESOURCE_DELETE_FAILURE,
    TRANSACTION_REQUEST, TRANSACTION_SUCCESS, TRANSACTION_FAILURE,
    ADD_NOTIFICATION, HIDE_NOTIFICATION,
    LOOKUP_COMPANY_CHANGE,
    LOOKUP_OWN_COMPANY_REQUEST, LOOKUP_OWN_COMPANY_SUCCESS, LOOKUP_OWN_COMPANY_FAILURE,
    LOOKUP_ADDRESS_REQUEST, LOOKUP_ADDRESS_SUCCESS, LOOKUP_ADDRESS_FAILURE,
    IMPORT_COMPANY_REQUEST, IMPORT_COMPANY_SUCCESS, IMPORT_COMPANY_FAILURE,
    IMPORT_BULK_REQUEST, IMPORT_BULK_SUCCESS, IMPORT_BULK_FAILURE,
    TRANSACTION_BULK_REQUEST, TRANSACTION_BULK_SUCCESS, TRANSACTION_BULK_FAILURE,
    VALIDATE_COMPANY_REQUEST, VALIDATE_COMPANY_SUCCESS, VALIDATE_COMPANY_FAILURE,
    VALIDATE_USER_REQUEST, VALIDATE_USER_SUCCESS, VALIDATE_USER_FAILURE,
    RENDER_DOCUMENT_REQUEST, RENDER_DOCUMENT_SUCCESS, RENDER_DOCUMENT_FAILURE,
    COMPANY_TAB_CHANGE,
    START_CREATE_COMPANY, END_CREATE_COMPANY,
    START_IMPORT_COMPANY, END_IMPORT_COMPANY,
    SHOW_TRANSACTION_VIEW, END_TRANSACTION_VIEW, NEXT_TRANSACTION_VIEW, PREVIOUS_TRANSACTION_VIEW, RESET_TRANSACTION_VIEWS,
    SHOW_CONTEXTUAL_TRANSACTION_VIEW, END_CONTEXTUAL_TRANSACTION_VIEW, NEXT_CONTEXTUAL_TRANSACTION_VIEW, PREVIOUS_CONTEXTUAL_TRANSACTION_VIEW,
    LAW_BROWSER_REQUEST, LAW_BROWSER_SUCCESS, LAW_BROWSER_FAILURE,
    UPDATE_MENU,
    SHOW_CONFIRMATION, END_CONFIRMATION,
    SHOW_LOADING, END_LOADING,
    TOGGLE_WIDGET_SIZE,
    WORKING_DAY_REQUEST, WORKING_DAY_SUCCESS, WORKING_DAY_FAILURE,
    SHOW_EMAIL_DOCUMENT, HIDE_EMAIL_DOCUMENT, SEND_DOCUMENT_REQUEST, SEND_DOCUMENT_SUCCESS, SEND_DOCUMENT_FAILURE,
    SHOW_VERSION_WARNING, HIDE_VERSION_WARNING
     } from './actionTypes';

const serialize = function(obj) {
  var str = [];
  for(var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
}



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

let notificationId = 0;
export function addNotification(data){
    return {type: ADD_NOTIFICATION, data: {...data, notificationId: notificationId++}};
}

export function hideNotification(notificationId){
    return {type: HIDE_NOTIFICATION, notificationId};
}

export function resetResources(){
    return {type: RESOURCE_RESET}
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
export function logout() {
    return {type: LOGOUT}
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

export function requestUserInfo(options = {}) {
    return {
        types: [USER_INFO_REQUEST, USER_INFO_SUCCESS, USER_INFO_FAILURE],
        callAPI: () => fetch('/api/get_info', {
            headers: json_headers,
            credentials: 'same-origin'
        }),
        shouldCallAPI: (state) => state.login.loggedIn && (!state.userInfo._status || options.refresh),
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
        payload: {key: resource, form: options.form, invalidateList: options.invalidates, loadingMessage: options.loadingMessage, loadingOptions: options.loadingOptions}
    };
}

export function updateResource(resource, data, options = {stringify: true}) {
    if(options && options.stringify === undefined){
        options = {...options, stringify: true}
    }

    return {
        types: [RESOURCE_UPDATE_REQUEST, RESOURCE_UPDATE_SUCCESS, RESOURCE_UPDATE_FAILURE],
        callAPI: () => fetch('/api' + (urls[resource] || resource), {
            method: 'PUT',
            headers: (options.stringify && data) ? json_headers : {
                ...accept_json_headers
            },
            body: (options.stringify && data) ? JSON.stringify(data) : data,
            credentials: 'same-origin'
        }),
        confirmation: options.confirmation,
        payload: {key: resource, form: options.form, invalidateList: options.invalidates, loadingMessage: options.loadingMessage, loadingOptions: options.loadingOptions}

    };
}

export function softDeleteResource(resource, options = {stringify: true}) {
    const data = {deleted: true};
    if(options && options.stringify === undefined){
        options = {...options, stringify: true}
    }
    if(!options.confirmation){
        options.confirmation = {
            title: 'Confirm Deletion',
            description: 'Please confirm the deletion of this item',
            resolveMessage: 'Confirm Deletion',
            resolveBsStyle: 'danger'
        };
    }
    return {
        types: [RESOURCE_UPDATE_REQUEST, RESOURCE_UPDATE_SUCCESS, RESOURCE_UPDATE_FAILURE],
        callAPI: () => fetch('/api' + (urls[resource] || resource), {
            method: 'PUT',
            headers: (options.stringify && data) ? json_headers : {
                ...accept_json_headers
            },
            body: (options.stringify && data) ? JSON.stringify(data) : data,
            credentials: 'same-origin'
        }),
        confirmation: options.confirmation,
        payload: {key: resource, form: options.form, invalidateList: options.invalidates, loadingMessage: options.loadingMessage, loadingOptions: options.loadingOptions}

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
        confirmation: options.confirmation,
        payload: {key: resource, invalidateList: options.invalidates, loadingMessage: options.loadingMessage, loadingOptions: options.loadingOptions}
    };
}

const WORKING_DAY_URL = 'https://api.catalex.nz';

export function requestWorkingDayOffset(query){
    const url = `${WORKING_DAY_URL}/?${serialize(query)}`;
    return {
        types: [WORKING_DAY_REQUEST, WORKING_DAY_SUCCESS, WORKING_DAY_FAILURE],
        callAPI: () => fetch(url, {
            credentials: 'same-origin'
        }),
        shouldCallAPI: (state) => !state.workingDays[url] || !state.workingDays[url]._status,
        rejectPayload: (state) => ({response: state.workingDays[url].data}),
        payload: {url: url},
    };

}



export function requestLawBrowser(url, options = {}) {
    return {
        types: [LAW_BROWSER_REQUEST, LAW_BROWSER_SUCCESS, LAW_BROWSER_FAILURE],
        callAPI: () => fetch(url, {
            credentials: 'same-origin'
        }),
        shouldCallAPI: (state) => !state.lawBrowser[url] || !state.lawBrowser[url]._status,
        payload: {url: url},
    };
}

export function renderTemplate(data = {}) {
    return {
        types: [RENDER_DOCUMENT_REQUEST, RENDER_DOCUMENT_SUCCESS, RENDER_DOCUMENT_FAILURE],
        callAPI: () => fetch('/api/render_template', {
            method: 'POST',
            headers: json_headers,
            body: JSON.stringify({goodCompaniesTemplate: true, ...data}),
            credentials: 'same-origin'
        })
    };
}




export function lookupCompany(query) {
    return {
        types: [LOOKUP_COMPANY_REQUEST, LOOKUP_COMPANY_SUCCESS, LOOKUP_COMPANY_FAILURE],
        callAPI: () => fetch('/api/company/lookup?query=' + encodeURIComponent(query), {
            headers: json_headers,
            credentials: 'same-origin'
        }),
        payload: {query: query}
    };
}

export function lookupOwnCompany(query) {
    return {
        types: [LOOKUP_OWN_COMPANY_REQUEST, LOOKUP_OWN_COMPANY_SUCCESS, LOOKUP_OWN_COMPANY_FAILURE],
        callAPI: () => fetch('/api/company/lookup_own?query=' + encodeURIComponent(query), {
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

export function importBulk(data) {
    return {
        types: [IMPORT_BULK_REQUEST, IMPORT_BULK_SUCCESS, IMPORT_BULK_FAILURE],
        callAPI: () => fetch('/api/company/import_bulk/companiesoffice', {
            method: 'POST',
            headers: json_headers,
            body: JSON.stringify(data),
            credentials: 'same-origin'
        }),
        shouldCallAPI: (state) => state.importBulk._status !== 'fetching',
        payload: {}
    };
}

export function transactionBulk(data) {
    return {
        types: [TRANSACTION_BULK_REQUEST, TRANSACTION_BULK_SUCCESS, TRANSACTION_BULK_FAILURE],
        callAPI: () => fetch('/api/bulk/transaction', {
            method: 'POST',
            headers: json_headers,
            body: JSON.stringify(data),
            credentials: 'same-origin'
        }),
        shouldCallAPI: (state) => state.transactionBulk._status !== 'fetching',
        payload: {}
    };
}

export function companyTransaction(transactionType, companyId, data, options={}) {
    const body = new FormData();
    body.append('json', JSON.stringify({...data, documents: null}));
    (data.documents ||[]).map(d => {
        // documents[] ?????
        body.append('documents', d, d.name);
    });
    const confirmation = !options.skipConfirmation && {
        title: 'Confirm Transaction',
        description: 'Please confirm the submission of this transaction',
        resolveMessage: 'Confirm',
        resolveBsStyle: 'primary'
    };
    return {
        types: [TRANSACTION_REQUEST, TRANSACTION_SUCCESS, TRANSACTION_FAILURE],
        callAPI: () => fetch('/api/transaction/'+transactionType+'/' +companyId, {
            method: 'POST',
            headers: accept_json_headers,
            body: body,
            credentials: 'same-origin'
        }),
        confirmation: confirmation,
        shouldCallAPI: (state) => state.transactions._status !== 'fetching',
        payload: {companyId: companyId, loadingMessage: options.loadingMessage || 'Submitting Transaction'}
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

export function showTransactionView(transactionView, data){
    return {
        type: SHOW_TRANSACTION_VIEW, transactionView, data
    }
}

export function endTransactionView(transactionView, data={}){
    return {
        type: END_TRANSACTION_VIEW, transactionView, data
    }
}

export function nextTransactionView(transactionView, data){
    return {
        type: NEXT_TRANSACTION_VIEW, transactionView, data
    }
}

export function previousTransactionView(transactionView){
    return {
        type: PREVIOUS_TRANSACTION_VIEW, transactionView
    }
}


export function showContextualTransactionView(contextKey, transactionView, data){
    return {
        type: SHOW_CONTEXTUAL_TRANSACTION_VIEW, contextKey, transactionView, data
    }
}

export function endContextualTransactionView(contextKey, transactionView, data={}){
    return {
        type: END_CONTEXTUAL_TRANSACTION_VIEW, contextKey, transactionView, data
    }
}

export function nextContextualTransactionView(contextKey, transactionView, data){
    return {
        type: NEXT_CONTEXTUAL_TRANSACTION_VIEW, contextKey, transactionView, data
    }
}

export function previousContextualTransactionView(contextKey, transactionView, data){
    return {
        type: PREVIOUS_CONTEXTUAL_TRANSACTION_VIEW, contextKey, transactionView, data
    }
}


export function resetTransactionViews(){
    return {
        type: RESET_TRANSACTION_VIEWS
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


export function showConfirmation(data){
    return {
        type: SHOW_CONFIRMATION, data
    }
}

export function endConfirmation(data){
    return {
        type: END_CONFIRMATION, data
    }
}

export function showLoading(data){
    return {
        type: SHOW_LOADING, data
    }
}

export function endLoading(data){
    return {
        type: END_LOADING, data
    }
}

export function showEmailDocument(data) {
    return {
        type: SHOW_EMAIL_DOCUMENT, data
    }
}

export function hideEmailDocument() {
    return {
        type: HIDE_EMAIL_DOCUMENT
    }
}

export function sendDocument(recipients, renderData) {
    renderData = {...renderData, goodCompaniesTemplate: true };

    return {
        types: [SEND_DOCUMENT_REQUEST, SEND_DOCUMENT_SUCCESS, SEND_DOCUMENT_FAILURE],
        callAPI: () => fetch('/api/send_template', {
            method: 'POST',
            headers: json_headers,
            body: JSON.stringify({ recipients, renderData }),
            credentials: 'same-origin'
        })
    };
}

export function lookupCompanyChange(query) {
    return {
        type: LOOKUP_COMPANY_CHANGE,
        payload: { query }
    };
}

export function showVersionWarning() {
    return { type: SHOW_VERSION_WARNING };
}

export function hideVersionWarning() {
    return { type: HIDE_VERSION_WARNING };
}
