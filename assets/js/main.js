import 'babel-core/polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import "../styles/style.scss";
import Root from "./root"
import configureStore from './store';
import DevTools from './components/devTools'
import 'react-date-picker/index.css';

let mountNode = document.getElementById("main");
if (mountNode){
    ReactDOM.render(<Root store={configureStore()}>
                       { __DEV__  ?  <DevTools /> : null }
                    </Root>
                    , mountNode);
}


