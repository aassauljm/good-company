import React from "react";
import ReactDOM from 'react-dom';
import Router from "./routes";
import Master from './stores/master';
import "../styles/style.scss"


let mountNode = document.getElementById("main");

try{
	let data = JSON.parse(document.getElementById("data").textContent);
	Master.loadData(data);
}catch(e){
	//do nothing
}

if (mountNode)
	ReactDOM.render(Router, mountNode);


