import 'babel-core/polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import Root from './routes';
import "../styles/style.scss"


let mountNode = document.getElementById("main");
if (mountNode)
    ReactDOM.render(<Root />, mountNode);


