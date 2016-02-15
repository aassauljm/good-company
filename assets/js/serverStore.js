import { createStore, applyMiddleware, compose } from 'redux';
import appReducer from './reducers';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import { callAPIMiddleware } from './middleware';
import routes from './routes'
import { syncHistory } from 'react-router-redux';

let data = {};


export default function configureStore(initialState=data) {
    const createStoreWithMiddleware = compose(
    applyMiddleware(
      thunkMiddleware,
      callAPIMiddleware)
    )(createStore);
    return createStoreWithMiddleware(appReducer, initialState);
}


export function configureHistoriedStore(history, initialState=data) {
    const reduxRouterMiddleware = syncHistory(history);
    const createStoreWithMiddleware = compose(
    applyMiddleware(
      thunkMiddleware,
      reduxRouterMiddleware,
      callAPIMiddleware)
    )(createStore);
    return createStoreWithMiddleware(appReducer, initialState);
}