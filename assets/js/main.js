"use strict";
import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import Root from "./root";
import configureStore from './store';
import { browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux'

import "../styles/style.scss";

let mountNode = document.getElementById("main");
let data = {};
try{
    data = JSON.parse(document.getElementById("data").textContent);
}catch(e){
    //do nothing
}

if (mountNode){
    const store = configureStore(browserHistory, data)
    const history = syncHistoryWithStore(browserHistory, store);
    ReactDOM.render(<Root store={store} history={history}>
                      {/* { __DEV__ && false  ?  <DevTools /> : null } */ }
                    </Root>
                    , mountNode);
}


