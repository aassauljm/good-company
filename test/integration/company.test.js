"use strict";
import React from 'react';
import ReactDOM from 'react-dom';
import {
  findRenderedComponentWithType,
  findRenderedDOMComponentWithTag,
  findRenderedDOMComponentWithClass,
  Simulate
} from 'react-addons-test-utils';
import { prepareApp, waitFor } from './helpers';
import { LoginForm } from ".../../../../assets/js/components/login.js";
import { Modals } from ".../../../../assets/js/components/modals.js";
import Modal from 'react-bootstrap/lib/Modal';
import chai from 'chai';
const should = chai.should();


describe('Import Company Integration ', () => {

    before('render', prepareApp);

    it('Imports Company', function(done){
        const dom = this.dom,
            form = findRenderedComponentWithType(this.tree, LoginForm),
        input = findRenderedDOMComponentWithTag(form.refs.identifier, 'input'),
            password = findRenderedDOMComponentWithTag(form.refs.password, 'input'),
            submit = findRenderedDOMComponentWithTag(form, 'button');
        input.value = 'integrate@email.com';
        Simulate.change(input);
        password.value = 'testtest';
        Simulate.change(password);
        Simulate.click(submit);
        waitFor('Waiting for login confirmation', 'a[href="/logout"]', dom)
            .then(() => {
                return waitFor('Waiting for user info', '.username.nav-link', dom);
            })
            .then(() => {
                Simulate.click(findRenderedDOMComponentWithClass(this.tree, 'nav-companies'));
                return waitFor('Companies page to load', '.company-import', dom);
            })
            .then(() => {
                Simulate.click(findRenderedDOMComponentWithClass(this.tree, 'company-import'));
             //   return waitFor('Modal to appear', '.modal-body', global.document);
            //})
            //.then(() => {
                const modal = findRenderedComponentWithType(this.tree, Modal)._modal;
                const input = findRenderedDOMComponentWithTag(modal, 'input');
                input.value = 'integration_test'
                Simulate.change(input);
                return waitFor('Modal results to appear', '.modal-body .list-group button', ReactDOM.findDOMNode(modal));
            })
            .then(() => {
                done();
            })
            .catch(done);
   });
});