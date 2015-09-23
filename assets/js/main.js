import 'babel-core/polyfill';
import React from "react";
import ReactDOM from 'react-dom';
import Router from "./routes";
import { Provider } from 'react-redux';
import "../styles/style.scss"


let mountNode = document.getElementById("main");
if (mountNode)
	ReactDOM.render(Router, mountNode);


