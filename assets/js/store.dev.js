"use strict";
import { createStore, applyMiddleware, compose } from 'redux';
import appReducer from './reducers';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import { callAPIMiddleware, confirmationMiddleware, addStateToWindow } from './middleware';
import { devTools, persistState } from 'redux-devtools';
import DevTools from './components/devTools';
import { routerMiddleware} from 'react-router-redux';
import createSagaMiddleware from 'redux-saga';
import { runSagas } from './sagas'

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
        addStateToWindow,
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
