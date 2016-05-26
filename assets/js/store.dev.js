"use strict";
import { createStore, applyMiddleware, compose } from 'redux';
import appReducer from './reducers';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import { callAPIMiddleware } from './middleware';
import { devTools, persistState } from 'redux-devtools';
import DevTools from './components/devTools';
import { routerMiddleware} from 'react-router-redux';


const data = {};

export default function configureStore(history, initialState=data) {
    let middleware;

    const loggerMiddleware = createLogger();
    middleware = applyMiddleware(
          thunkMiddleware,
          loggerMiddleware,
          routerMiddleware(history),
          callAPIMiddleware)

    const createStoreWithMiddleware = compose(
                middleware,
                // Lets you write ?debug_session=<name> in address bar to persist debug sessions
                // persistState('dev')
                // Provides support for DevTools:
                DevTools.instrument()
            )(createStore)



    const store = createStoreWithMiddleware(appReducer, initialState);
    return store;
}
