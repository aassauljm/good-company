"use strict";
import { createStore, applyMiddleware, compose } from 'redux';
import appReducer from './reducers';
import thunkMiddleware from 'redux-thunk';
import { callAPIMiddleware } from './middleware';
import { syncHistory } from 'react-router-redux';


const data = {};

export default function configureStore(history, initialState=data) {
    let middleware;
    const reduxRouterMiddleware = syncHistory(history);
    middleware = applyMiddleware(
          thunkMiddleware,
          reduxRouterMiddleware,
          callAPIMiddleware)

    const createStoreWithMiddleware = compose(
                middleware,
            )(createStore);


    const store = createStoreWithMiddleware(appReducer, initialState);
    reduxRouterMiddleware.listenForReplays(store);
    return store;
}
