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
    ADD_NOTIFICATION, HIDE_NOTIFICATION
    //UPLOAD_FILE_REQUEST, UPLOAD_FILE_SUCCESS, UPLOAD_FILE_FAILURE
     } from './actions'
import { reducer as formReducer } from 'redux-form';
import { routerStateReducer } from 'redux-router';

const initialState = {

};


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
            return {...state, ...{_status: 'fetching'}};
        case USER_INFO_SUCCESS:
            return {...state, ...action.response, ...{_status: 'complete'}};
        case USER_INFO_FAILURE:
            return {...state, ...action.response, ...{_status: 'error'}};
        default:
            return state;
    }
}

function notifications(state = {list: []}, action){
    switch(action.type){
        case ADD_NOTIFICATION:
            return {...state, list: [...state.list, action.data]};
        case HIDE_NOTIFICATION:
            state.list.splice(action.index);
            return {...state, list: state.list.slice()};
        default:
            return state;
    }
}
const default_resources = {users: {}, roles: {}, documents: {}}

function resources(state = default_resources, action){
    switch(action.type){
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
            return {...state, ...{[action.key]: {...{data: action.response, _status: 'error'}}}};


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


const form = formReducer.plugin({
    account: (state, action) => {
      if (action.form !== 'account'){
        return state;
      }
      return processResource(state, action);
    },
    login: (state, action) => {
        switch(action.type) {
            case LOGIN_SUCCESS:
                return {...state, ...{password: {}}};
            case LOGIN_FAILURE:
                return {...state, ...{_error: 'Invalid Credentials'}};
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
});

const appReducer = combineReducers({
  router: routerStateReducer,
  login,
  userInfo,
  resources,
  form,
  notifications
});


export default appReducer;