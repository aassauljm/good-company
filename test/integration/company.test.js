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
import { LoginForm } from "../../assets/js/components/login.js";
import { Modals } from "../../assets/js/components/transactionViews.js";
import { ShareClassesTable  } from "../../assets/js/components/shareClasses.js";
import { CompanyAlertsWidget } from "../../assets/js/components/companyAlerts.js";
import { ConnectedPlaceholderSearch } from '../../assets/js/components/search.js';
import chai from 'chai';


const should = chai.should();


const navigateClick = (el) => {
    Simulate.click(el, {button: 0});
}


describe('Company Integration Tests', () => {

    before('render', prepareApp);

    describe('Import ', () => {
        it('Imports Company', function(done){
            let search, dom = this.dom;
            waitFor('Waiting for login confirmation', 'div.welcome-back', dom)
                .then(() => {
                    return waitFor('Companies page to load', '.auto-suggest', dom);
                })
                .then(() => {
                    search = findRenderedComponentWithType(this.tree, ConnectedPlaceholderSearch);
                    const input = findRenderedDOMComponentWithTag(search, 'input');
                    Simulate.focus(input);
                    input.value = 'PROJECT MANAGER HOLDINGS LIMITED'
                    Simulate.change(input);
                    return waitFor('Drop down results to appear', '.suggest-container > *', dom);
                })
                .then(() => {
                    const item = findRenderedDOMComponentWithClass(search, 'list-group-item-heading');
                    Simulate.click(item);
                    return waitFor('Selection to be made', 'button.import-company', dom);
                })
                .then((button) => {
                    Simulate.click(button);
                    return waitFor('Selection to be made', 'a.view-company', dom, 10000);
                })
                .then((el) => {
                    navigateClick(el);
                    return waitFor('Company to load', '.company-page.company-loaded', dom, 5000)
                })
                .then(() => {
                    done();
                })
                .catch((e) => {
                    done(e);
                });
       });


        it('sets up shareholdings', function(done){
            let dom = this.dom;
            const alerts = findRenderedComponentWithType(this.tree, CompanyAlertsWidget);
            const setup = findRenderedDOMComponentWithClass(alerts, 'guided-setup-link');
            navigateClick(setup);

            return waitFor('Voter selection to be visible', '.voter-select .btn-primary', this.dom, 10000)
             .then(button => {
                Simulate.click(button);
                return waitFor('Share class page to load', '.create-new', this.dom, 5000)
             })
             .then(() => {
                done();
             })
             .catch(e => {
                done(e);
             });

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
                el.value = 'Ordinary';
                Simulate.change(el);
                Simulate.submit(findRenderedDOMComponentWithClass(this.tree, 'share-class-form'));
                return waitFor('Share class page to load again', () => this.dom.querySelectorAll('.share-class-table tr').length === 2, this.dom, 5000)
            })
            .then(() => {
                const el = findRenderedDOMComponentWithClass(this.tree, 'create-new');
                Simulate.click(el, {button: 0});
                return waitFor('New share class page to load', '.share-class-name', this.dom)
            })
            .then(el => {
                el.value = 'Privileged';
                Simulate.change(el);
                Simulate.submit(findRenderedDOMComponentWithClass(this.tree, 'share-class-form'));
                return waitFor('Share class page to load again again', () => this.dom.querySelectorAll('.share-class-table tr').length === 3, this.dom, 5000)
            })
            .then(el => {
                const table = findRenderedComponentWithType(this.tree, ShareClassesTable);
                const rows = scryRenderedDOMComponentsWithTag(table, 'tr');
                rows.length.should.be.equal(3);
                Simulate.click(findRenderedDOMComponentWithClass(this.tree, 'btn-success'), {button: 0});
                done();
            })
            .catch(e => {
                done(e);

            });
    });

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
});
