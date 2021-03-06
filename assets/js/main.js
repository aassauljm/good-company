"use strict";
import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import Root from "./root";
import configureStore from './store';
import { browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux'
import configureRaven from './configureRaven';

import "../styles/style.scss";


let mountNode = document.getElementById("main");
let data = {};
try{
    data = {...data, ...JSON.parse(document.getElementById("data").textContent)};
    const recurse = (obj) => {
        for(let x in obj){
            if(!!obj[x] && typeof(obj[x]) === "object"){
                if(obj[x] && obj[x]._status === 'fetching'){
                    delete obj[x]._status;
                }
                recurse(obj[x])
            }
        }
    }
    recurse(data);
    console.log('Data loaded');
}catch(e){
    //do nothing
}

try{
    data = {...data, version: JSON.parse(document.getElementById("version").textContent)};
}catch(e){
    //do nothing
}

if (mountNode){
    const store = configureStore(browserHistory, data);
    const history = syncHistoryWithStore(browserHistory, store);

    // Attach getState to window, we need it for user feedback
    // which is not using to redux
    window.getState = store.getState;

    // Sentry error reporting
    configureRaven(store.getState);

    ReactDOM.render(<Root store={store} history={history}>
                      {/* { __DEV__ && false  ?  <DevTools /> : null } */ }
                    </Root>
                    , mountNode);
}


