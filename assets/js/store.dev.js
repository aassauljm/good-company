"use strict";
import { createStore, applyMiddleware, compose } from 'redux';
import appReducer from './reducers';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import { callAPIMiddleware, confirmationMiddleware } from './middleware';
import { devTools, persistState } from 'redux-devtools';
import DevTools from './components/devTools';
import { routerMiddleware} from 'react-router-redux';
import createSagaMiddleware from 'redux-saga';
import { runSagas } from './sagas'
import perf from 'react-addons-perf';

if(typeof window !== 'undefined'){
    window.reactPerf = perf;
}


const data = {};



export default function configureStore(history, initialState=data) {
    let middleware;
    const sagaMiddleware = createSagaMiddleware()

    const loggerMiddleware = createLogger();
    middleware = applyMiddleware(
        sagaMiddleware,
        thunkMiddleware,
        loggerMiddleware,
        routerMiddleware(history),
        confirmationMiddleware,
        callAPIMiddleware
    );

    const createStoreWithMiddleware = compose(
        middleware,
        // Lets you write ?debug_session=<name> in address bar to persist debug sessions
        // persistState('dev')
        // Provides support for DevTools:
        DevTools.instrument()
    )(createStore);

    const store = createStoreWithMiddleware(appReducer, initialState);;
    runSagas(sagaMiddleware);


    return store;
}
