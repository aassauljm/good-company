import React from 'react';
import ReactDOM from 'react-dom';
import {
  findRenderedComponentWithType,
  findRenderedDOMComponentWithTag,
  Simulate
} from 'react-addons-test-utils';
import { prepareApp, waitFor } from './helpers';
import { LoginForm } from "../../assets/js/components/login.js";
import chai from 'chai';
const should = chai.should();


describe.skip('Renders full ', () => {

    before('render', prepareApp);

    it('gets log in menu', function(done){
        const dom = this.dom,
            form = findRenderedComponentWithType(this.tree, LoginForm),
        input = findRenderedDOMComponentWithTag(form.refs.identifier, 'input'),
            password = findRenderedDOMComponentWithTag(form.refs.password, 'input'),
            submit = findRenderedDOMComponentWithTag(form, 'button');
        should.not.equal(null, this.dom.querySelector('a[href="/login"]'));
        should.equal(null, this.dom.querySelector('a[href="/logout"]'));
        input.value = 'integrate@email.com';
        Simulate.change(input);
        password.value = 'testtest';
        Simulate.change(password);
        Simulate.click(submit);
        waitFor('Waiting for login confirmation', 'a[href="/logout"]', dom)
            .then(function(){
                return waitFor('Waiting for user info', '.username.nav-link', dom)
            })
            .then(function(el){
                el.innerHTML.should.equal('integrate');
                done();
            });
   });
});
