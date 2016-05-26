"use strict";
import { createStore, applyMiddleware, compose } from 'redux';
import appReducer from './reducers';
import thunkMiddleware from 'redux-thunk';
import { callAPIMiddleware } from './middleware';
import {  routerMiddleware} from 'react-router-redux';


const data = {};

export default function configureStore(history, initialState=data) {
    let middleware;

    middleware = applyMiddleware(
          thunkMiddleware,
          routerMiddleware(history),
          callAPIMiddleware)

    const createStoreWithMiddleware = compose(
                middleware,
            )(createStore);
    const store = createStoreWithMiddleware(appReducer, initialState);
    return store;
}
