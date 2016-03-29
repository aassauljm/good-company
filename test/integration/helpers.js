import React from 'react';
import ReactDOM from 'react-dom';
import {
  renderIntoDocument
} from 'react-addons-test-utils';
import configureStore from ".../../../../assets/js/store.prod";
import routes from ".../../../../assets/js/routes";
import Root from ".../../../../assets/js/root";
import Promise from "bluebird";
import { createMemoryHistory } from 'react-router'
const LOOP = 20;
const DOMTIMEOUT = 3000;
import { loadOnServer } from 'redux-async-connect';
import { match } from 'react-router';



export function waitFor(msg, sel, dom){
    let interval,
        start = Date.now();
    return new Promise(function(resolve, reject){
        function _run(){
            const el = dom.querySelector(sel);
            if(el){
                resolve(el);
            }
            else{
                if((Date.now() - start)  > DOMTIMEOUT){
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

export function prepareApp(url = '/login'){
    const history = createMemoryHistory(url);
    const store = configureStore(history);
    this.store = store;
    return new Promise((resolve, reject) => {
        match({history, routes: routes(store), location: url}, (error, redirectLocation, renderProps) => {
            if (redirectLocation) {
                return prepareApp(redirectLocation.pathname)
                    .then(() => { resolve()})
            }
            return loadOnServer({...renderProps, store}).then(() => {
                this.tree = renderIntoDocument(<Root store={store} history={history}/>);
                this.dom = ReactDOM.findDOMNode(this.tree);
                resolve();
            });
        });
    })


}
