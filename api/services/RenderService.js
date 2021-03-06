"use strict"
import React from 'react'
import createLocation from 'history/lib/createLocation'
import { renderToString } from 'react-dom/server'
import routes from '../../assets/js/routes';
import configureStore from '../../assets/js/store.prod';
import Root from '../../assets/js/root';
import { Provider } from 'react-redux';
import { match } from 'react-router';
import { createMemoryHistory } from 'react-router'
import { loadOnServer } from 'redux-connect';
import { setFetch, getFetch } from "../../assets/js/utils";
import fetch from 'isomorphic-fetch';
import { syncHistoryWithStore } from 'react-router-redux'
import Promise from 'bluebird';
import shittyLodash from 'react-widgets/lib/util/_.js';

export function serverRender(url, cookie, state={}){
    const memoryHistory = createMemoryHistory(url);
    const store = configureStore(memoryHistory, state);
    const history = syncHistoryWithStore(memoryHistory, store);
    const _fetch = getFetch();
    setFetch(function(url, args={}){
        url = 'http://localhost:'+sails.config.port+url;
        return fetch(url, _.merge(args, {headers: _.merge(args.headers, {'Cookie': cookie})}))
    });
    return new Promise((resolve, reject) => {
        shittyLodash.resetUniqueId();
        match({history, routes: routes(store), location: url}, (error, redirectLocation, renderProps) => {
            if (error) {
                reject({code: 500, message: error.message});
            }
            else if (redirectLocation) {
                reject({redirectLocation: redirectLocation})
            }
            else {
                loadOnServer({...renderProps, store})
                .then(() => {
                    const output = renderToString(<Root store={store} history={history} />);
                    resolve({reactOutput: output, data: JSON.stringify(store.getState())});
                })
                .catch(error => {
                    sails.log.error(error);
                    reject({code: 500, message: error.message});
                })
                .then(() => {
                    setFetch(_fetch);
                })
            }
        });
    });
}
