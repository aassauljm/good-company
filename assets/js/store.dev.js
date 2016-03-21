"use strict";
import { createStore, applyMiddleware, compose } from 'redux';
import appReducer from './reducers';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import { callAPIMiddleware } from './middleware';
import { devTools, persistState } from 'redux-devtools';
import DevTools from './components/devTools';
import { syncHistory } from 'react-router-redux';


const data = {};

export default function configureStore(history, initialState=data) {
    let middleware;
    const reduxRouterMiddleware = syncHistory(history);
    const loggerMiddleware = createLogger();
    middleware = applyMiddleware(
          thunkMiddleware,
          loggerMiddleware,
          reduxRouterMiddleware,
          callAPIMiddleware)

    const createStoreWithMiddleware = compose(
                middleware,
                // Lets you write ?debug_session=<name> in address bar to persist debug sessions
                // persistState('dev')
                // Provides support for DevTools:
                DevTools.instrument()
            )(createStore)



    const store = createStoreWithMiddleware(appReducer, initialState);
    reduxRouterMiddleware.listenForReplays(store);
    return store;
}
