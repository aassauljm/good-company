import { combineReducers } from 'redux';
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
    LOOKUP_COMPANY_REQUEST, LOOKUP_COMPANY_SUCCESS, LOOKUP_COMPANY_FAILURE,
    LOOKUP_OWN_COMPANY_REQUEST, LOOKUP_OWN_COMPANY_SUCCESS, LOOKUP_OWN_COMPANY_FAILURE,
    IMPORT_COMPANY_REQUEST, IMPORT_COMPANY_SUCCESS, IMPORT_COMPANY_FAILURE,
    IMPORT_BULK_REQUEST, IMPORT_BULK_SUCCESS, IMPORT_BULK_FAILURE,
    TRANSACTION_BULK_REQUEST, TRANSACTION_BULK_SUCCESS, TRANSACTION_BULK_FAILURE,
    RENDER_DOCUMENT_REQUEST, RENDER_DOCUMENT_SUCCESS, RENDER_DOCUMENT_FAILURE,
    COMPANY_TAB_CHANGE,
    START_CREATE_COMPANY, END_CREATE_COMPANY,
    START_IMPORT_COMPANY, END_IMPORT_COMPANY,
    SHOW_TRANSACTION_VIEW, END_TRANSACTION_VIEW, NEXT_TRANSACTION_VIEW, PREVIOUS_TRANSACTION_VIEW, RESET_TRANSACTION_VIEWS,
    SHOW_CONTEXTUAL_TRANSACTION_VIEW, END_CONTEXTUAL_TRANSACTION_VIEW, NEXT_CONTEXTUAL_TRANSACTION_VIEW, PREVIOUS_CONTEXTUAL_TRANSACTION_VIEW,
    SHOW_CONFIRMATION, END_CONFIRMATION,
    SHOW_LOADING, END_LOADING,
    UPDATE_MENU, TOGGLE_WIDGET_SIZE,
    LAW_BROWSER_REQUEST, LAW_BROWSER_SUCCESS, LAW_BROWSER_FAILURE,
    WORKING_DAY_REQUEST, WORKING_DAY_SUCCESS, WORKING_DAY_FAILURE,
    SHOW_EMAIL_DOCUMENT, HIDE_EMAIL_DOCUMENT,
    SEND_DOCUMENT_REQUEST, SEND_DOCUMENT_SUCCESS, SEND_DOCUMENT_FAILURE
     } from './actionTypes';

import {
    BLUR, CHANGE, DESTROY, FOCUS, INITIALIZE, RESET, START_ASYNC_VALIDATION, START_SUBMIT, STOP_ASYNC_VALIDATION,
    STOP_SUBMIT, SUBMIT_FAILED, TOUCH, UNTOUCH, ADD_ARRAY_VALUE, REMOVE_ARRAY_VALUE
    } from 'redux-form/lib/actionTypes';

import {reducer as formReducer} from 'redux-form';
import validator from 'validator'
import { relationNameToModel } from './schemas';
import { routerReducer, LOCATION_CHANGE } from 'react-router-redux'
import { reducer as reduxAsyncConnect } from 'redux-connect'
import { calculateReciprocals } from './components/forms/amend';
import update from 'immutability-helper';

const initialState = {

};

function companySchema(){
    return {
        directors: [],
        holders:[]
    }
}



function login(state = {
    loggedIn: false
}, action){
    switch(action.type){
        case LOGIN_START:
            return state
        case LOGIN_REQUEST:
            return state;
        case LOGIN_SUCCESS:
            return {...state, loggedIn: true};
        case LOGOUT:
        case LOGIN_FAILURE:
            return {...state, loggedIn: false};
        case RESOURCE_CREATE_SUCCESS:
            if(action.form === 'signup'){
                return {...state, loggedIn: true};
            }
            return state;
        default:
            return state;
    }
}

function userInfo(state = {}, action){
    switch(action.type){
        case USER_INFO_REQUEST:
            return {...state, _status: 'fetching'};
        case USER_INFO_SUCCESS:
            return {...state, ...action.response, _status: 'complete'};
        case USER_INFO_FAILURE:
            return {...state, ...action.response, _status: 'error'};
        default:
            return state;
    }
}

function notifications(state = {list: []}, action){
    switch(action.type){
        case ADD_NOTIFICATION:
            return {...state, list: [...state.list, action.data]};
        case HIDE_NOTIFICATION:
            const list = state.list.slice();
            const index = list.findIndex(n => n.notificationId === action.notificationId);
            if(index > -1){
                list.splice(index, 1);
            }
            return {...state, list: list};
        default:
            return state;
    }
}

function lookupCompany(state = {list: []}, action){
    switch(action.type){
        case LOOKUP_COMPANY_REQUEST:
            return {...state, _status: 'fetching'};
        case LOOKUP_COMPANY_SUCCESS:
            return {...state, list: action.response, _status: 'complete'};
        case LOOKUP_COMPANY_FAILURE:
            return {...state, _status: 'error'};
        default:
            return state;
    }
}

function lookupOwnCompany(state = {list: []}, action){
    switch(action.type){
        case LOOKUP_OWN_COMPANY_REQUEST:
            return {...state, _status: 'fetching'};
        case LOOKUP_OWN_COMPANY_SUCCESS:
            return {...state, list: action.response, _status: 'complete'};
        case LOOKUP_OWN_COMPANY_FAILURE:
            return {...state, _status: 'error'};
        default:
            return state;
    }
}

function importCompany(state = {}, action){
    switch(action.type){
        case IMPORT_COMPANY_REQUEST:
            return {...state, _status: 'fetching'};
        case IMPORT_COMPANY_SUCCESS:
            return {...state, data: action.response, _status: 'complete'};
        case IMPORT_COMPANY_FAILURE:
            return {...state, data: action.response, _status: 'error'};
        default:
            return state;
    }
}

function importBulk(state = {}, action){
    switch(action.type){
        case IMPORT_BULK_REQUEST:
            return {...state, _status: 'fetching'};
        case IMPORT_BULK_SUCCESS:
            return {...state, data: action.response, _status: 'complete'};
        case IMPORT_BULK_FAILURE:
            return {...state, data: action.response, _status: 'error'};
        default:
            return state;
    }
}

function transactionBulk(state = {}, action){
    switch(action.type){
        case TRANSACTION_BULK_REQUEST:
            return {...state, _status: 'fetching'};
        case TRANSACTION_BULK_SUCCESS:
            return {...state, data: action.response, _status: 'complete'};
        case TRANSACTION_BULK_FAILURE:
            return {...state, data: action.response, _status: 'error'};
        default:
            return state;
    }
}

function companyPage(state = {tabIndex: 0}, action){
    switch(action.type){
        case COMPANY_TAB_CHANGE:
            return {...state, tabIndex: action.tabIndex};
        default:
            return state;
    }
}

function transactionViews(state = {}, action){
    switch(action.type){
        case START_CREATE_COMPANY:
            return {...state, showing: 'createCompany', createCompany: {index: 0}};
        case END_CREATE_COMPANY:
            if(state.showing === 'createCompany')
                return {...state, showing: null};
            return state;
        case START_IMPORT_COMPANY:
            return {...state, showing: 'importCompany', importCompany: {index: 0}};
        case END_IMPORT_COMPANY:
            if(state.showing === 'importCompany')
                return {...state, showing: null};
            return state;

        case SHOW_TRANSACTION_VIEW:
            return {...state, showing: action.transactionView, [action.transactionView]: {index: (action.data||{}).index || 0, data: action.data}};
        case END_TRANSACTION_VIEW:
            return {...state, showing: null, [action.transactionView]: null };
        case NEXT_TRANSACTION_VIEW:
            const index = action.data && action.data.index !== undefined ? action.data.index : state[action.transactionView].index + 1;
            return {...state,  [action.transactionView]: {index: index, data: {...(state[action.transactionView] || {}).data, ...action.data}}};
        case PREVIOUS_TRANSACTION_VIEW:
            return {...state,  [action.transactionView]: {index: state[action.transactionView].index - 1}};
        case RESET_TRANSACTION_VIEWS:
            return {} ;

        case LOCATION_CHANGE:
            return {...state, showing: false}


        default:
            return state;
    }
}

function contextualTransactionViews(state = {}, action){
    switch(action.type){
        case SHOW_CONTEXTUAL_TRANSACTION_VIEW:
        case END_CONTEXTUAL_TRANSACTION_VIEW:
        case NEXT_CONTEXTUAL_TRANSACTION_VIEW:
        case PREVIOUS_CONTEXTUAL_TRANSACTION_VIEW:
            return {...state, [action.contextKey]: ((state)  => {
                switch(action.type){
                    case SHOW_CONTEXTUAL_TRANSACTION_VIEW:
                        return {...state, showing: action.transactionView, [action.transactionView]: {index: (action.data||{}).index || 0, data: action.data}};
                    case END_CONTEXTUAL_TRANSACTION_VIEW:
                        return {...state, showing: null, [action.transactionView]: null };
                    case NEXT_CONTEXTUAL_TRANSACTION_VIEW:
                        const index = action.data && action.data.index !== undefined ? action.data.index : state[action.transactionView].index + 1;
                        return {...state,  [action.transactionView]: {index: index, data: {...(state[action.transactionView] || {}).data, ...action.data}}};
                    case PREVIOUS_CONTEXTUAL_TRANSACTION_VIEW:
                        return {...state,  [action.transactionView]: {index: state[action.transactionView].index - 1}};
                    default:
                        return state;
                }
                })(state[action.contextKey])};
        case RESET_TRANSACTION_VIEWS:
            return {} ;
        default:
            return state
    }
}

function menus(state = {shareRegister: {view: 'document'}}, action){
    switch(action.type){
        case UPDATE_MENU:
            return {...state, [action.menu]: action.data};
        default:
            return state;
    }
}

function widgets(state = {}, action){
    switch(action.type){
        case TOGGLE_WIDGET_SIZE:
            let current = {...state};
            state = current;
            action.path.map(p => {
                current[p] = {...(current[p] || {})}
                current = current[p];
            })
            current.expanded = action.value;
            return state
        default:
            return state;
    }
}


function transactions(state = {}, action){
    switch(action.type){
        case TRANSACTION_REQUEST:
            return {...state, _status: 'fetching'};
        case TRANSACTION_SUCCESS:
            return {...state, data: action.response, _status: 'complete'};
        case TRANSACTION_FAILURE:
            return {...state, data: action.response, _status: 'error'};
        default:
            return state;
        }
}

function renderTemplate(state = {}, action){
    switch(action.type){
        case RENDER_DOCUMENT_REQUEST:
            return {...state, _status: 'fetching'};
        case RENDER_DOCUMENT_SUCCESS:
            return {...state, data: action.response, _status: 'complete'};
        case RENDER_DOCUMENT_FAILURE:
            return {...state, data: action.response, _status: 'error'};
        default:
            return state;
        }
}

function sendDocument(state = {}, action){
    switch(action.type){
        case SEND_DOCUMENT_REQUEST:
            return {...state, _status: 'fetching'};
        case SEND_DOCUMENT_SUCCESS:
            return {...state, data: action.response, _status: 'complete'};
        case SEND_DOCUMENT_FAILURE:
            return {...state, data: action.response, _status: 'error'};
        default:
            return state;
    }
}


const default_resources = {users: {}, roles: {}, documents: {}, companies: {}}

function resources(state = default_resources, action){
    switch(action.type){
        // wipe resources
        case LOGIN_SUCCESS:
        case TRANSACTION_SUCCESS:
            return default_resources;
        case RESOURCE_REQUEST:
        case RESOURCE_CREATE_REQUEST:
        case RESOURCE_UPDATE_REQUEST:
        case RESOURCE_DELETE_REQUEST:
            return {...state, ...{[action.key]: {...state[action.key], _status: 'fetching'}}};

        case RESOURCE_SUCCESS:
            return {...state, ...{[action.key]: {...{data: action.response, _status: 'complete'}}}};

        case RESOURCE_FAILURE:
        case RESOURCE_CREATE_FAILURE:
        case RESOURCE_UPDATE_FAILURE:
        case RESOURCE_DELETE_FAILURE:
            return {...state, ...{[action.key]: {...{error: action.response, _status: 'error'}}}};

        case IMPORT_COMPANY_SUCCESS:
        case RESOURCE_CREATE_SUCCESS:
        case RESOURCE_UPDATE_SUCCESS:
        case RESOURCE_DELETE_SUCCESS:
            if(action.invalidateList){
                const keys = Object.keys(state);
                const invalidated = keys.reduce((acc, key) => {
                    return action.invalidateList.reduce((acc, invalid) => {
                        if(key.indexOf(invalid) === 0 && key !== action.key){
                            acc[key] = null;
                        }
                        return acc;
                    }, acc);
                }, {});
                return {...state, ...invalidated, ...{[action.key]: {...{data: action.response, _status: 'complete'}}} }
            }
            else{
                // basically invalidate our entire cache
                return default_resources;
            }
            //return {...state, ...{[action.key]: {...{data: {}, status: 'complete'}}}};
        case RESOURCE_RESET:
            return default_resources;
        default:
            return state;
    }
}

function lawBrowser(state = {}, action){
    switch(action.type){
        case LAW_BROWSER_REQUEST:
            return {...state, ...{[action.url]: {...state[action.url], _status: 'fetching'}}};
        case LAW_BROWSER_SUCCESS:
            return {...state, ...{[action.url]: {...{data: action.response, _status: 'complete'}}}};
        case LAW_BROWSER_FAILURE:
            return {...state, ...{[action.url]: {...{error: action.response, _status: 'error'}}}};
        default:
            return state;
    }
}

function workingDays(state = {}, action){
    switch(action.type){
        case WORKING_DAY_REQUEST:
            return {...state, ...{[action.url]: {...state[action.url], _status: 'fetching'}}};
        case WORKING_DAY_SUCCESS:
            return {...state, ...{[action.url]: {...{data: action.response, _status: 'complete'}}}};
        case WORKING_DAY_FAILURE:
            return {...state, ...{[action.url]: {...{error: action.response, _status: 'error'}}}};
        default:
            return state;
    }
}

function mergeErrors(state, err){
     return {
            ...state,
            ...Object.keys(err||{}).reduce((acc, key) => {
                    return {...acc, [key]: {...state[key], submitError: err[key].map(e=>e.message||e.value)}}
                }, {}),
            _error: !!Object.keys(err||{}).length
        }
}

function processResource(state, action) {
    switch(action.type) {
        case RESOURCE_SUCCESS:
            return {
            ...state,
            ...Object.keys(action.response).reduce((acc, key) => {
                    return {...acc, [key]: {value: action.response[key],  initial: action.response[key]}}
                }, {})
          };

        case RESOURCE_CREATE_SUCCESS:
            return {};

        case RESOURCE_FAILURE:
        case RESOURCE_CREATE_FAILURE:
        case RESOURCE_UPDATE_FAILURE:
        case RESOURCE_DELETE_FAILURE:
            const err = (action.response||{}).invalidAttributes || {};
           return mergeErrors(state, err);

        default:
          return state;
      }
}


function modals(state = {}, action) {
    switch(action.type){
        case SHOW_CONFIRMATION:
            return {...state, confirmation: {...action.data, showing: true}}
        case END_CONFIRMATION:
            return {...state, confirmation: {...action.data, showing: false}}
        case SHOW_LOADING:
            return {...state, loading: {...action.data, showing: true}}
        case END_LOADING:
            return {...state, loading: {...action.data, showing: false}}
        case SHOW_EMAIL_DOCUMENT:
            return {...state, emailDocument: {renderData: action.data, showing: true}}
        case HIDE_EMAIL_DOCUMENT:
            return {...state, emailDocument: {showing: false}}

        case RESOURCE_REQUEST:
        case RESOURCE_CREATE_REQUEST:
        case RESOURCE_UPDATE_REQUEST:
        case RESOURCE_DELETE_REQUEST:
        case TRANSACTION_REQUEST:
            if(action.loadingMessage){
                return {...state, loading: {message: action.loadingMessage, showing: true, ...(action.loadingOptions || {})}};
            }
            return state;
        case RESOURCE_FAILURE:
        case RESOURCE_CREATE_FAILURE:
        case RESOURCE_UPDATE_FAILURE:
        case RESOURCE_DELETE_FAILURE:
        case TRANSACTION_FAILURE:
        case RESOURCE_SUCCESS:
        case RESOURCE_CREATE_SUCCESS:
        case RESOURCE_UPDATE_SUCCESS:
        case RESOURCE_DELETE_SUCCESS:
        case TRANSACTION_SUCCESS:
        case TRANSACTION_FAILURE:
            if(action.loadingMessage){
                return {...state, loading: {message: action.loadingMessage, showing: false, ...(action.loadingOptions || {})}};
            }
            return state;
        default:
          return state;
    }
}


const normalizeNumber = (value) => {
    return value ? value.replace(/[^\d]/g, '') : value
}


export const form = formReducer.plugin({
    amend: (state, action) => {
        switch(action.type) {
            case FOCUS:
            case BLUR:
            case REMOVE_ARRAY_VALUE:
            case ADD_ARRAY_VALUE:
                return { ...state, actions: calculateReciprocals(state.actions)}
            default:
                return state
      }
  },
    shareClass: (state, action) => {
        switch(action.type) {
            case "redux-form/CHANGE":
                if(action.field === 'votingRights.1(a)'){
                    state = {...state};
                    state.decisionMakingRights = {...(state.decisionMakingRights || {})};
                    state.decisionMakingRights.dividend = {...(state.decisionMakingRights.dividend || {})};
                    state.decisionMakingRights.constitution = {...(state.decisionMakingRights.constitution || {})};
                    state.decisionMakingRights.capitalVariation = {...(state.decisionMakingRights.capitalVariation || {})};
                    state.decisionMakingRights.appointDirector= {...(state.decisionMakingRights.appointDirector || {})};
                    if(action.value) {
                        return update({decisionMakingRights: {}, ...state}, {decisionMakingRights: {
                            "dividend": {value: {$set: true}},
                            "constitution": {value: {$set: true}},
                            "capitalVariation": {value: {$set: true}},
                            "appointDirector": {value: {$set: true}}}})
                    }
                }
                if(action.field.indexOf('decisionMakingRights.') === 0){
                    if(!action.value) {
                        state = {...state};
                        state.votingRights = {...(state.votingRights || {})};
                        state.votingRights["1(a)"] = {...(state.votingRights["1(a)"] || {})};
                        return update(state, {votingRights: {"1(a)": {value: {$set: false}}}})
                    }
                }
            default:
                return state
            }
        }
});

const appReducer = combineReducers({
    routing: routerReducer,
    companyPage,
    transactions,
    lookupCompany,
    lookupOwnCompany,
    importCompany,
    importBulk,
    transactionBulk,
    login,
    userInfo,
    resources,
    form,
    notifications,
    transactionViews,
    contextualTransactionViews,
    menus,
    widgets,
    renderTemplate,
    lawBrowser,
    workingDays,
    modals,
    sendDocument,
    reduxAsyncConnect
});


export default appReducer;
