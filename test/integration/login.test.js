import React from 'react';
import ReactDOM from 'react-dom';
import Promise from "bluebird";
import {
  renderIntoDocument,
  findRenderedComponentWithType,
  findRenderedDOMComponentWithTag,
  Simulate
} from 'react-addons-test-utils';
import {configureHistoriedStore} from ".../../../../assets/js/serverStore";
import Root from ".../../../../assets/js/root";
import {LoginForm} from ".../../../../assets/js/components/login.js";
import { match } from 'redux-router/server';
import chai from 'chai';
const should = chai.should();

const LOOP = 20;
const DOMTIMEOUT = 12000;

function waitFor(msg, sel, dom){
    let interval,
        start = Date.now();
    return new Promise(function(resolve, reject){
        function _run(){
            if(dom.querySelector(sel)){
                resolve();
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

describe('Renders full ', () => {
    before('render', function(){
        const store = configureHistoriedStore();
        this.tree = renderIntoDocument(<Root store={store}/>);
        this.dom = ReactDOM.findDOMNode(this.tree);
    });

    it('gets log in menu', function(done){
        const form = findRenderedComponentWithType(this.tree, LoginForm);
        should.not.equal(null, this.dom.querySelector('a[href="/login"]'));
        should.equal(null, this.dom.querySelector('a[href="/logout"]'));
        const input = findRenderedDOMComponentWithTag(form.refs.email, 'input');
        input.value = 'integrate@email.com';
        Simulate.change(input);
        const password = findRenderedDOMComponentWithTag(form.refs.password, 'input');
        password.value = 'testtest';
        Simulate.change(password);
        const submit = findRenderedDOMComponentWithTag(form.refs.submit, 'input');
        Simulate.click(submit);
        waitFor('Waiting for login confirmation', 'a[href="/logout"]', this.dom)
            //.then(done);
   });
});