import { combineReducers } from 'redux';
import {
    LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAILURE,
    USER_INFO_REQUEST, USER_INFO_SUCCESS, USER_INFO_FAILURE,
    RESOURCE_REQUEST, RESOURCE_SUCCESS, RESOURCE_FAILURE
     } from './actions'

const initialState = {

};


function login(state = {
    loggedIn: false,
    loginError: null
}, action){
    switch(action.type){
        case LOGIN_REQUEST:
            return state;
        case LOGIN_SUCCESS:
            return {...state, ...{loggedIn: true}};
        case LOGIN_FAILURE:
            return {...state, ...{loginError: 'Invalid Credentials'}};
        default:
            return state;
    }
}

function userInfo(state = {}, action){
    switch(action.type){
        case USER_INFO_REQUEST:
            return {...state, ...{status: 'fetching'}};
        case USER_INFO_SUCCESS:
            return {...state, ...action.response, ...{status: 'complete'}};
        case USER_INFO_FAILURE:
            return {...state, ...action.response, ...{status: 'error'}};
        default:
            return state;
    }
}

function resources(state = {users: {}, roles: {}}, action){
    switch(action.type){
        case RESOURCE_REQUEST:
            return {...state, ...{[action.key]: {status: 'fetching'}}};
        case RESOURCE_SUCCESS:
            return {...state, ...{[action.key]: {...{data: action.response, status: 'complete'}}}};
        case RESOURCE_FAILURE:
            return {...state, ...{[action.key]: {...{data: action.response, status: 'error'}}}};
        default:
            return state;
    }
}

const appReducer = combineReducers({
  login,
  userInfo,
  resources
});


export default appReducer;