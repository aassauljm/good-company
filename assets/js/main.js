import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import Root from "./root";
import configureStore from './store';
import DevTools from './components/devTools';
import { browserHistory } from 'react-router';

import "../styles/style.scss";

let mountNode = document.getElementById("main");
let data = {};
try{
    data = JSON.parse(document.getElementById("data").textContent);
}catch(e){
    //do nothing
}

if (mountNode){
    ReactDOM.render(<Root store={configureStore(browserHistory, data)} history={browserHistory}>
                      {/* { __DEV__ && false  ?  <DevTools /> : null } */ }
                    </Root>
                    , mountNode);
}


