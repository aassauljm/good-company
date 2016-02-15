"use strict";
import { createStore, applyMiddleware, compose } from 'redux';
import appReducer from './reducers';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import { stopSubmit } from 'redux-form/lib/actions';
import { callAPIMiddleware } from './middleware';
import { devTools, persistState } from 'redux-devtools';
import DevTools from './components/devTools';
import { syncHistory } from 'react-router-redux';
import { browserHistory } from 'react-router'

let middleware;

const reduxRouterMiddleware = syncHistory(browserHistory);

if(__DEV__){
    const loggerMiddleware = createLogger();
    middleware = applyMiddleware(
          thunkMiddleware,
          loggerMiddleware,
          reduxRouterMiddleware,
          callAPIMiddleware)
}
else{
    middleware = applyMiddleware(
          thunkMiddleware,
          reduxRouterMiddleware,
          callAPIMiddleware)
}

let data;

try{
    data = JSON.parse(document.getElementById("data").textContent);
}catch(e){
    //do nothing
}



const createStoreWithMiddleware = __DEV__ ?
        compose(
            middleware,
            // Lets you write ?debug_session=<name> in address bar to persist debug sessions
            // persistState('dev')
            // Provides support for DevTools:
            DevTools.instrument()
        )(createStore)
        :
        compose(
            middleware,
        )(createStore);


export default function configureStore(initialState=data) {
    const store = createStoreWithMiddleware(appReducer, initialState);
    reduxRouterMiddleware.listenForReplays(store);
    return store;
}