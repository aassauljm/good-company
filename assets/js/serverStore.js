import { createStore, applyMiddleware, compose } from 'redux';
import appReducer from './reducers';
import { reduxReactRouter as reduxReactRouterServer } from 'redux-router/server';
import { reduxReactRouter } from 'redux-router';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import { callAPIMiddleware } from './middleware';
import routes from './routes'
import createHistory from 'history/lib/createMemoryHistory';

let data = {};


export default function configureStore(initialState=data) {
    const createStoreWithMiddleware = compose(
    applyMiddleware(
      thunkMiddleware,
      callAPIMiddleware),
       reduxReactRouterServer({ routes })
    )(createStore);
    return createStoreWithMiddleware(appReducer, initialState);
}


export function configureHistoriedStore(initialState=data) {
    let history = createHistory();
    const createStoreWithMiddleware = compose(
    applyMiddleware(
      thunkMiddleware,
      callAPIMiddleware),
       reduxReactRouter({ history, routes })
    )(createStore);
    history.pushState(null, '/');
    return createStoreWithMiddleware(appReducer, initialState);
}