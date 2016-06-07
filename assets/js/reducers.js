import { combineReducers } from 'redux';
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
    IMPORT_COMPANY_REQUEST, IMPORT_COMPANY_SUCCESS, IMPORT_COMPANY_FAILURE,
    COMPANY_TAB_CHANGE,
    START_CREATE_COMPANY, END_CREATE_COMPANY,
    START_IMPORT_COMPANY, END_IMPORT_COMPANY,
    SHOW_MODAL, END_MODAL,
    NEXT_MODAL, PREVIOUS_MODAL,
    UPDATE_MENU, TOGGLE_WIDGET_SIZE
     } from './actionTypes';

import { BLUR, CHANGE, DESTROY, FOCUS, INITIALIZE, RESET, START_ASYNC_VALIDATION, START_SUBMIT, STOP_ASYNC_VALIDATION,
STOP_SUBMIT, SUBMIT_FAILED, TOUCH, UNTOUCH } from 'redux-form/lib/actionTypes';

import {reducer as formReducer} from 'redux-form';
import validator from 'validator'
import { relationNameToModel } from './schemas';
import { routerReducer } from 'react-router-redux'
import { reducer as reduxAsyncConnect } from 'redux-connect'

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
            list.splice(action.index, 1);
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

function companyPage(state = {tabIndex: 0}, action){
    switch(action.type){
        case COMPANY_TAB_CHANGE:
            return {...state, tabIndex: action.tabIndex};
        default:
            return state;
    }
}

function modals(state = {createCompany: {index: 0}}, action){
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

        case SHOW_MODAL:
            return {...state, showing: action.modal, [action.modal]: {index: (action.data||{}).index || 0, data: action.data}};
        case END_MODAL:
            return {...state, showing: null, [action.modal]: null };
        case NEXT_MODAL:
            return {...state,  [action.modal]: {index: state[action.modal].index + 1, data: action.data}};
        case PREVIOUS_MODAL:
            return {...state,  [action.modal]: {index: state[action.modal].index - 1}};
        default:
            return state;
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

const default_resources = {users: {}, roles: {}, documents: {}, companies: {}}

function resources(state = default_resources, action){
    switch(action.type){
        case LOGIN_SUCCESS:
        case TRANSACTION_SUCCESS:
            return default_resources;
        case RESOURCE_REQUEST:
        case RESOURCE_CREATE_REQUEST:
        case RESOURCE_UPDATE_REQUEST:
        case RESOURCE_DELETE_REQUEST:
            return {...state, ...{[action.key]: {_status: 'fetching'}}};

        case RESOURCE_SUCCESS:
            return {...state, ...{[action.key]: {...{data: action.response, _status: 'complete'}}}};

        case RESOURCE_FAILURE:
        case RESOURCE_CREATE_FAILURE:
        case RESOURCE_UPDATE_FAILURE:
        case RESOURCE_DELETE_FAILURE:
            return {...state, ...{[action.key]: {...{error: action.response, _status: 'error'}}}};


        case RESOURCE_CREATE_SUCCESS:
        case RESOURCE_UPDATE_SUCCESS:
        case RESOURCE_DELETE_SUCCESS:
            if(action.invalidateList){
                const keys = Object.keys(state);
                const invalidated = keys.reduce((acc, key) => {
                    return action.invalidateList.reduce((acc, invalid) => {
                        if(key.indexOf(invalid) === 0){
                            acc[key] = null;
                        }
                        return acc;
                    }, acc);
                }, {});
                return {...state, ...invalidated }
            }
            else{
                // basically invalidate our entire cache
                return default_resources;
            }
            //return {...state, ...{[action.key]: {...{data: {}, status: 'complete'}}}};
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

function processResource(state, action){
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

function reduxAsyncWithClear(state, action){
    state = reduxAsyncConnect(state, action);
    switch(action.type){
        case TRANSACTION_SUCCESS:
        case RESOURCE_CREATE_SUCCESS:
        case RESOURCE_UPDATE_SUCCESS:
        case RESOURCE_DELETE_SUCCESS:
            return {} //return {loadState: {company: {loaded: false}}};
    }
    return state;

}


const normalizeNumber = (value) => {
    return value ? value.replace(/[^\d]/g, '') : value
}


export const formBase = formReducer.normalize({
    /*parcel: {
        amount: normalizeNumber
    },*/
    issue: {
         'parcel.amount': normalizeNumber,

    },
    signup: {
        email: (value) => {
            return value ? value.toLowerCase(): value
        }
    }
}).plugin({
    account: (state, action) => {
      if (action.form !== 'account'){
        return state;
      }
      return processResource(state, action);
    },
    login: (state, action) => {
        switch(action.type) {
            case LOGIN_SUCCESS:
                return {...state, password: {}};
            case LOGIN_FAILURE:
                return {...state, _error: 'Invalid Credentials'};
            default:
        }
        if (action.form !== 'login'){
            return state;
        }
        switch(action.type){
            case CHANGE:
            case RESET:
                return {...state, _error: null};
            default:
                return state;
        }
    },
    signup: (state, action) => {
        if (action.form !== 'signup'){
            return state;
        }
        state = processResource(state, action);
        switch(action.type) {
            case RESOURCE_SUCCESS:
                return {...state, ...{password: {}, repeatPassword: {}}};
            default:
                return state;
            }
    },
    setPassword: (state, action) => {
        switch(action.type) {
            case SET_PASSWORD_FAILURE:
                return mergeErrors(state, action.response);
            default:
                return state;
            }
    }
})


export const form = formReducer;

const appReducer = combineReducers({
    routing: routerReducer,
    companyPage,
    transactions,
    lookupCompany,
    lookupOwnCompany,
    importCompany,
    login,
    userInfo,
    resources,
    form: form,
    notifications,
    modals,
    menus,
    widgets,
    reduxAsyncConnect: reduxAsyncConnect
});


export default appReducer;