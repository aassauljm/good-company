"use strict";
import { createStore, applyMiddleware, compose } from 'redux';
import appReducer from './reducers';
import createHistory from 'history/lib/createBrowserHistory';
import { reduxReactRouter } from 'redux-router';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import { stopSubmit } from 'redux-form/lib/actions';
import { callAPIMiddleware } from './middleware';
import { devTools, persistState } from 'redux-devtools';
import DevTools from './components/devTools';

let middleware;


if(__DEV__){
    const loggerMiddleware = createLogger();
    middleware = applyMiddleware(
          thunkMiddleware,
          loggerMiddleware,
          callAPIMiddleware)
}
else{
    middleware = applyMiddleware(
          thunkMiddleware,
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
            reduxReactRouter({ createHistory}),
            // Provides support for DevTools:
               DevTools.instrument(),
              // Lets you write ?debug_session=<name> in address bar to persist debug sessions
              persistState(window.location.href.match(/[?&]debug_session=([^&]+)\b/))
        )(createStore)
        :
        compose(
            middleware,
            reduxReactRouter({ createHistory}),

        )(createStore);


export default function configureStore(initialState=data) {
  return createStoreWithMiddleware(appReducer, initialState);
}