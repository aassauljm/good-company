import 'babel-core/polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import Root from "./root"
import configureStore from './store';
import DevTools from './components/devTools';

import "../styles/style.scss";

let mountNode = document.getElementById("main");
if (mountNode){
    ReactDOM.render(<Root store={configureStore()}>
                       { __DEV__ && false  ?  <DevTools /> : null }
                    </Root>
                    , mountNode);
}


