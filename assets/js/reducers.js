import { combineReducers } from 'redux';
import {
    LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAILURE,
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
    IMPORT_COMPANY_REQUEST, IMPORT_COMPANY_SUCCESS, IMPORT_COMPANY_FAILURE,
    COMPANY_TAB_CHANGE,
    START_CREATE_COMPANY, END_CREATE_COMPANY,
    START_IMPORT_COMPANY, END_IMPORT_COMPANY,
    SHOW_MODAL, END_MODAL,
    NEXT_MODAL, PREVIOUS_MODAL,
    REMOVE_LIST_ENTRY, ADD_LIST_ENTRY
     } from './actionTypes';

import { BLUR, CHANGE, DESTROY, FOCUS, INITIALIZE, RESET, START_ASYNC_VALIDATION, START_SUBMIT, STOP_ASYNC_VALIDATION,
STOP_SUBMIT, SUBMIT_FAILED, TOUCH, UNTOUCH } from 'redux-form/lib/actionTypes';

//import formReducer from './customFormReducer';
import {reducer as formReducer} from 'redux-form';
import validator from 'validator'
import { relationNameToModel } from './schemas';
import { routeReducer } from 'react-router-redux'

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
        case LOGIN_REQUEST:
            return state;
        case LOGIN_SUCCESS:
            return {...state, ...{loggedIn: true}};
        case LOGIN_FAILURE:
            return {...state, ...{loggedIn: false}};
        case RESOURCE_CREATE_SUCCESS:
            if(action.form === 'signup'){
                return {...state, ...{loggedIn: true}};
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
            return {...state, showing: action.modal, [action.modal]: {index: 0, data: action.data}};
        case END_MODAL:
            return {...state, showing: null, [action.modal]: null};
        case NEXT_MODAL:
            return {...state,  [action.modal]: {index: state[action.modal].index + 1, data: action.data}};
        case PREVIOUS_MODAL:
            return {...state,  [action.modal]: {index: state[action.modal].index - 1}};
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
            return default_resources;
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


function addChildren(type, data = {}){
    const genList = (key, defaultSub = []) => {
        const count = len(data[key]);
        const keyList = Array(count).fill().map((x, i) => i.toString());

        return {
            list: keyList,
            counter: keyList.length-1,
            ...((data[key] || defaultSub).reduce((acc, value, index) => {
                acc[index.toString()] = addChildren(key) //, data[key])
                return acc;
            }, {}))
        }
    }
    const len = (array, defaultLength = 1) =>{
        return array ? array.length || defaultLength : defaultLength;
    }
    switch(type){
        case 'holdings':
            return {
                holders: genList('holders'),
                parcels: genList('parcels')
            };
        case 'companyFull':
            return {
                directors: genList('directors'),
                shareClasses: genList('shareClasses'),
                holdings: genList('holdings', [null])
            };
        default:
            return {};
    }
}

function traverse(state, path, cb){
    const key = path.shift();
    if(path.length){
        return {...state, [key]: traverse(state[key], path, cb)};
    }
    return {...state, [key]: cb(state[key], key)};
}


function addListEntry(state, path){
    const _path = [...path];
    state = traverse(state, _path, (obj, key) => {
        const counter = obj.counter + 1;
        // counter is just for unique formKey strings
        const label = counter.toString();
        return {
                ...obj,
                counter,
                list: [...obj.list, label],
                [label] : addChildren(key)
            }
    });
    return state;
}


function removeListEntry(state, path){
    path = [...path];
    const key = path.pop();
    return traverse(state, path, (obj) => {
        const list = [...obj.list];
        list.splice(list.indexOf(key), 1);
        obj = {...obj};
        delete obj[key];
        return {
                ...obj,
                list
            };
    });

}

function reduceListChange(state, action){
    switch(action.type) {
        case ADD_LIST_ENTRY:
            return addListEntry(state, action.path);
        case REMOVE_LIST_ENTRY:
            return removeListEntry(state, action.path);
        default:
            return state;
    }
}

function handleKeyedFormRemoval(state, action){
    if(action.type === REMOVE_LIST_ENTRY){
        if(state[action.path.join('.')]){
            return {...state, [action.path.join('.')]: undefined}
        }
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
    },
    lookupCompany: (state, action) => {
        return state;
    },
    companyFull: (state, action) => {
        state = handleKeyedFormRemoval(state, action);

        if(action.form !== 'companyFull'){
            return state;
        }
        return reduceListChange(state, action)
    },
    holding: (state, action) => {
        state = handleKeyedFormRemoval(state, action);
        if(action.form !== 'holding'){
            return state;
        }
        return reduceListChange(state, action)
    },
    person: (state, action) => {
        state = handleKeyedFormRemoval(state, action);
        return state;
    },
    parcel: (state, action) => {
        state = handleKeyedFormRemoval(state, action);
        return state;
    },
    shareClass: (state, action) => {
        state = handleKeyedFormRemoval(state, action);
        return state;
    },
})



function populateCompanyFull(state, formKey, data){
    // TODO, refactor
    const toValues = (data) => {
        return Object.keys(data).reduce((acc, key) => {
            // if is not an object or array
            if(data[key] !== Object(data[key])){
                acc[key] = {initialValue: data[key], value: data[key]}
            }
            return acc;
        }, {})
    }
    state = {...state, companyFull: {...state.companyFull, [formKey]: {...state.companyFull[formKey], ...toValues(data)} }};
    ['directors', 'shareClasses'].map(name => {
        (data[name] || []).map((item, i) => {
            const key = `${formKey}.${name}.${i}`;
            state = {...state, [relationNameToModel(name)]: {...state[relationNameToModel(name)], [key]: toValues(item)}}
        })
    });
    (data.holdings || []).map((holding, i) => {
        ['parcels', 'holders'].map(name => {
            (holding[name] || []).map((item, j) => {
                const key = `${formKey}.holdings.${i}.${name}.${j}`;
                state = {...state, [relationNameToModel(name)]: {...state[relationNameToModel(name)], [key]: toValues(item)}}
            });
        });
    });
    return state;
}

function depopulateCompanyFull(state, formKey){
    // will do dumb way for now
    return Object.keys(state).reduce((acc, form) => {
        acc[form] = Object.keys(state[form]).reduce((acc, key) => {
            if(key !== formKey && key.indexOf(`${formKey}.`) !== 0){
                acc[key] = state[form][key];
            }
            return acc;
        }, {})
        return acc;
    }, {});
}


export function formWithCleanup(state = {}, action){
    // todo, destroy all linked forms
    if(action.type === END_CREATE_COMPANY){
        state = depopulateCompanyFull(state, action.formKey);
    }
    return formBase(state, action);
}

export function formPopulation(state = {}, action){
    if(action.type === START_CREATE_COMPANY){
        state = {...state, companyFull: {...state.companyFull, [action.formKey]: addChildren('companyFull', action.data)}}
        if(action.data){
            state = populateCompanyFull(state, action.formKey, action.data);
        }
    }
    return formWithCleanup(state, action);
}

export const form = formPopulation;

const appReducer = combineReducers({
    routing: routeReducer,
    companyPage,
    transactions,
    lookupCompany,
    importCompany,
    login,
    userInfo,
    resources,
    form: form,
    notifications,
    modals
});


export default appReducer;