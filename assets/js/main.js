import 'babel-core/polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import "../styles/style.scss";
import Root from "./root"
import configureStore from './store';

let mountNode = document.getElementById("main");
if (mountNode)
    ReactDOM.render(<Root store={configureStore()}/>, mountNode);


