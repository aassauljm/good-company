"use strict";
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));
const cheerio = require('cheerio');
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
import { ShareClassSelect } from '../../assets/js/components/transactions/applyShareClasses.js';
import { ImportHistoryChunkTransactionView} from '../../assets/js/components/transactions/importHistoryChunk.js';
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
                el.value = 'Preference';
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

    it('Applies share classes', function(done){
        let shareClassData, classes;
        const shareClassMap = {};
        return fs.readFileAsync('test/fixtures/transactionData/projectManagerHoldingsTwoShareClasses.json', 'utf8')
            .then(data => {
                shareClassData = JSON.parse(data).reduce((acc, item) => {
                    acc[JSON.stringify(item.holders)] = item.parcels;
                    return acc;
                }, {});

                return waitFor('Transaction page to load', '.apply-share-classes', this.dom)
            })
            .then(el => {
                const shareClassSelect = findRenderedComponentWithType(this.tree, ShareClassSelect);
                const tbody = findRenderedDOMComponentWithTag(shareClassSelect, 'tbody');
                const rows = tbody.querySelectorAll('tr');
                let parcelCount = 0;
                [].map.call(rows, (row, i) => {
                    const names = [].map.call(row.querySelectorAll('td:nth-child(2) li'), l => cheerio(l.outerHTML).text());
                    const nameString = JSON.stringify(names);
                    classes = shareClassData[nameString];

                    const select = row.querySelector('select');
                    const addNew = row.querySelector('.add-parcel');
                    _.map(select.children, option => {
                         shareClassMap[option.innerHTML] = option.value;
                    });
                    Object.keys(classes).map((shareClass, i) => {
                        if(i < Object.keys(classes).length -1){
                            Simulate.click(addNew, {button: 0});
                        }
                        parcelCount++;
                    });
                })
                return waitFor('Parcels to render', () => this.dom.querySelectorAll('.parcel-row').length === parcelCount, this.dom, 1000)
            })
            .then(() => {
                const shareClassSelect = findRenderedComponentWithType(this.tree, ShareClassSelect);
                const tbody = findRenderedDOMComponentWithTag(shareClassSelect, 'tbody');
                const rows = tbody.querySelectorAll('tr');
                [].map.call(rows, (row, i) => {
                    const names = [].map.call(row.querySelectorAll('td:nth-child(2) li'), l => cheerio(l.outerHTML).text());
                    const nameString = JSON.stringify(names);
                    classes = shareClassData[nameString];

                    const select = row.querySelector('select');
                    const addNew = row.querySelector('.add-parcel');
                    Object.keys(classes).map((shareClass, i) => {
                        const parcelRow = row.querySelectorAll(`.parcel-row`)[i]
                        const select = parcelRow.querySelector('select');
                        const input =  parcelRow.querySelector('input');
                        Simulate.change(select, { target: {value: shareClassMap[shareClass]} });
                        Simulate.change(input, { target: {value: classes[shareClass]+''} });
                    });
                })
                return waitFor('Validation to complete', () => !this.dom.querySelectorAll('.has-error').length, null, 1000)
            })

            .then(() => {
                Simulate.click(findRenderedDOMComponentWithClass(this.tree, 'submit'));
                return waitFor('For import chunk page to display', () => scryRenderedComponentsWithType(this.tree,  ImportHistoryChunkTransactionView ).length, this.dom, 5000);
            })

            .then(() => {
                done();
            })
            .catch((e) => {
                console.log(e);
                done(e)
            })
    });

/*
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
