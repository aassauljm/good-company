import React from 'react';
import ReactDOM from 'react-dom';
import {
  renderIntoDocument
} from 'react-addons-test-utils';
import {configureHistoriedStore} from ".../../../../assets/js/serverStore";
import Root from ".../../../../assets/js/root";
import Promise from "bluebird";

const LOOP = 20;
const DOMTIMEOUT = 1000;

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

export function prepareApp(){
    const store = configureHistoriedStore();
    this.tree = renderIntoDocument(<Root store={store}/>);
    this.dom = ReactDOM.findDOMNode(this.tree);
}
