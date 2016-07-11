"use strict";
import React from 'react';
import ReactDOM from 'react-dom';
import {
  findRenderedComponentWithType,
  findRenderedDOMComponentWithTag,
  findRenderedDOMComponentWithClass,
  scryRenderedDOMComponentsWithTag,
  scryRenderedComponentsWithType,
  Simulate
} from 'react-addons-test-utils';
import { prepareApp, waitFor } from './helpers';
import { LoginForm } from ".../../../../assets/js/components/login.js";
import { Modals } from ".../../../../assets/js/components/modals.js";
import { ShareClasses } from ".../../../../assets/js/components/shareClasses.js";
import Search from '.../../../../assets/js/components/search.js';
import chai from 'chai';
const should = chai.should();


describe('Company Integration Tests', () => {
    before('render', prepareApp);

    it('Imports Company', function(done){
        let search;
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
                return waitFor('Companies page to load', '.auto-suggest', dom);
            })
            .then(() => {
                search = findRenderedComponentWithType(this.tree, Search);
                const input = findRenderedDOMComponentWithTag(search, 'input');
                input.value = 'integration_test'
                Simulate.change(input);
                //return waitFor('Drop down results to appear', '.suggest-container', dom);
            })
            .then(() => {
                // Click 2nd item
                //Simulate.click(scryRenderedDOMComponentsWithTag(findRenderedComponentWithType(modal, Modal.Body), 'button')[1]);
                // Import
                //Simulate.click(scryRenderedDOMComponentsWithTag(findRenderedComponentWithType(modal, Modal.Body), 'button')[0]);
                // Can take some time
                //return waitFor('Company page to load', '.company', dom, 10000);
            })
            .then(() => {
                done();
            })
            .catch(done);
   });
    /*it('Sets up shares', function(done){
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
                Simulate.submit(findRenderedDOMComponentWithTag(this.tree, 'form'));
                return waitFor('Share class page to load again', '.create-new', this.dom)
            })
            .then(el => {
                Simulate.click(el, {button: 0});
                return waitFor('New share class page to load', '.share-class-name', this.dom)
            })
            .then(el => {
                el.value = 'Class B';
                Simulate.change(el);
                Simulate.submit(findRenderedDOMComponentWithTag(this.tree, 'form'));
                return waitFor('Share class page to load again again', '.create-new', this.dom)
            })
            .then(el => {
                const table = findRenderedComponentWithType(this.tree, ShareClasses);
                const rows = scryRenderedDOMComponentsWithTag(table, 'tr');
                rows.length.should.be.equal(3);
                Simulate.click(findRenderedDOMComponentWithClass(this.tree, 'return-company-page'), {button: 0});
                done();
            })
    });*/

    /*it('Applies share classes', function(done){
        let modal;
        const linkNode = findRenderedDOMComponentWithClass(this.tree, 'new-transaction');
        Simulate.click(linkNode, {button: 0});
        return waitFor('Transaction page to load', '.apply-share-classes', this.dom)
            .then(el => {
                Simulate.click(el);
                modal = findRenderedComponentWithType(this.tree, Modal)._modal;
                const selects = scryRenderedDOMComponentsWithTag(modal, 'select');

                const shareClassMap = {};
                _.map(selects[0].children, option => {
                     shareClassMap[option.innerHTML] = option.value;
                })
                selects.map((s, i) => {
                    s.value = shareClassMap[i % 2 ? 'Class A': 'Class B'];
                    Simulate.change(s);
                });
                Simulate.click(findRenderedDOMComponentWithClass(modal, 'submit'));
                return waitFor('Modal to close', () => !scryRenderedComponentsWithType(this.tree, Modal).length, null, 10000);
            })
            .then(() => {
                return waitFor('Company data to reload', '.return-company-page', this.dom);
            })
            .then((el) => {
                Simulate.click(el, {button: 0});
                done();
            });
    });

    it('It goes to share register', function(done){
        let modal;
        const linkNode = findRenderedDOMComponentWithClass(this.tree, 'share-register');
        Simulate.click(linkNode, {button: 0});
        return waitFor('Share register', () => this.dom.querySelectorAll('table.share-register tbody tr').length)
            .then(length => {
                length.should.be.equal(40)
                done();
            });
    });*/

});