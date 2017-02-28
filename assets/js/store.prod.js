"use strict";
import { createStore, applyMiddleware, compose } from 'redux';
import appReducer from './reducers';
import thunkMiddleware from 'redux-thunk';
import { callAPIMiddleware, confirmationMiddleware } from './middleware';
import {  routerMiddleware} from 'react-router-redux';
import createSagaMiddleware from 'redux-saga';
import { runSagas } from './sagas'

const data = {};

export default function configureStore(history, initialState=data) {
    let middleware;
    const sagaMiddleware = createSagaMiddleware();

    middleware = applyMiddleware(
            sagaMiddleware,
          thunkMiddleware,
          routerMiddleware(history),
          confirmationMiddleware,
          callAPIMiddleware)

    const createStoreWithMiddleware = compose(
                middleware,
            )(createStore);

    const store= createStoreWithMiddleware(appReducer, initialState);;
    runSagas(sagaMiddleware);

    return store;
}
