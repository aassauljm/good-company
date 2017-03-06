import React from 'react';
import ReactDOM from 'react-dom';
import { renderIntoDocument } from 'react-addons-test-utils';
import configureStore from "../../assets/js/store.prod";
import routes from "../../assets/js/routes";
import Root from "../../assets/js/root";
import Promise from "bluebird";
import { createMemoryHistory, match } from 'react-router'
import { loadOnServer } from 'redux-connect';
import { createStore, applyMiddleware, compose } from 'redux';
import appReducer from '../../assets/js/reducers';
import { fetch } from '../../assets/js/utils';
import thunkMiddleware from 'redux-thunk';
import sinon from 'sinon';


const LOOP = 20;
const DOMTIMEOUT = 3000;

export function waitFor(msg, sel, dom, timeout=DOMTIMEOUT){
    let interval,
        start = Date.now();
    const test = typeof sel === 'function' ? sel : () => dom.querySelector(sel);
    return new Promise(function(resolve, reject){
        function _run(){
            const el = test();
            if(el){
                resolve(el);
            }
            else{
                if((Date.now() - start)  > timeout){
                    reject(msg);
                }
            }
        }
        interval = setInterval(_run, LOOP);
    })
    .finally(function(){
        clearInterval(interval);
    })
}
const json_headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};


function login(credentials) {
    return fetch('/auth/local', {
            method: 'POST',
            headers: json_headers,
            credentials: 'same-origin',
            body: JSON.stringify({...credentials, noRedirect: true})
        })
}


export function prepareApp(url = '/', username='companycreator@email.com'){
    const state = {login: {loggedIn: true}};
    const history = createMemoryHistory(url);
    const store = configureStore(history, state);

    this.store = store;

    return login({'identifier': username, 'password': 'testtest'})
        .then(() => {
            return new Promise((resolve, reject) => {
            match({history, routes: routes(store), location: url}, (error, redirectLocation, renderProps) => {
                if (redirectLocation) {
                    return prepareApp(redirectLocation.pathname)
                        .then(() => { resolve()})
                }
                return loadOnServer({...renderProps, store}).then(() => {
                    this.tree = renderIntoDocument(<Root store={store} history={history} connectDragSource={el => el} />);
                    this.dom = ReactDOM.findDOMNode(this.tree);
                    resolve();
                });
            });
        });
    });
}

export function destroyApp(){
    ReactDOM.unmountComponentAtNode(document);
}

export function simpleStore(){
    return compose(
                 applyMiddleware(thunkMiddleware)
            )(createStore)(appReducer, {});
}
