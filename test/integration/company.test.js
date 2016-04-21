"use strict";
import React from 'react';
import ReactDOM from 'react-dom';
import {
  findRenderedComponentWithType,
  findRenderedDOMComponentWithTag,
  findRenderedDOMComponentWithClass,
  scryRenderedDOMComponentsWithTag,
  Simulate
} from 'react-addons-test-utils';
import { prepareApp, waitFor } from './helpers';
import { LoginForm } from ".../../../../assets/js/components/login.js";
import { Modals } from ".../../../../assets/js/components/modals.js";
import Modal from 'react-bootstrap/lib/Modal';
import chai from 'chai';
const should = chai.should();


describe('Company Integration Tests', () => {

    before('render', prepareApp);

    it('Imports Company', function(done){
        let modal;
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
                modal = findRenderedComponentWithType(this.tree, Modal)._modal;
                const input = findRenderedDOMComponentWithTag(modal, 'input');
                input.value = 'integration_test'
                Simulate.change(input);
                return waitFor('Modal results to appear', '.modal-body .list-group button', ReactDOM.findDOMNode(modal));
            })
            .then(() => {
                // Click 2nd item
                Simulate.click(scryRenderedDOMComponentsWithTag(findRenderedComponentWithType(modal, Modal.Body), 'button')[1]);
                // Import
                Simulate.click(scryRenderedDOMComponentsWithTag(findRenderedComponentWithType(modal, Modal.Body), 'button')[0]);
                // Can take some time
                return waitFor('Company page to load', '.company', dom, 10000);
            })
            .then(() => {
                done();
            })
            .catch(done);
   });
    it('Sets up shares', function(done){
        const linkNode = findRenderedDOMComponentWithClass(this.tree, 'share-classes');
        Simulate.click(linkNode, {button: 0});
        return waitFor('Share class page to load', '.create-new', this.dom)
            .then(el => {
                Simulate.click(el, {button: 0});
                return waitFor('New share class page to load', '.share-class-name', this.dom)
            })
            .then(el => {
                el.value = 'Class A';
                Simulate.change(el);
                Simulate.click(findRenderedDOMComponentWithClass(this.tree, 'submit-new'));
                return waitFor('Share class page to load again', '.create-new', this.dom)
            })
            .then(el => {
                Simulate.click(el, {button: 0});
                return waitFor('New share class page to load', '.share-class-name', this.dom)
            })
            .then(el => {
                el.value = 'Class B';
                Simulate.change(el);
                Simulate.click(findRenderedDOMComponentWithClass(this.tree, 'submit-new'));
                return waitFor('Share class page to load again', '.create-new', this.dom)
            })
            .then(el => {
                done();
            })
    });
    it('Applies share classes', function(done){
        let modal;
        const linkNode = findRenderedDOMComponentWithClass(this.tree, 'new-transaction');
        Simulate.click(linkNode, {button: 0});
        return waitFor('Transaction page to load', '.apply-share-classes', this.dom)
            .then(el => {
                Simulate.click(el);
                modal = findRenderedComponentWithType(this.tree, Modal)._modal;
                done();
            });
    });

});