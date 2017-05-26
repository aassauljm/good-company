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
import { prepareApp, destroyApp, waitFor } from './helpers';
import { LoginForm } from "../../assets/js/components/login.js";
import { Modals } from "../../assets/js/components/transactionViews.js";
import { ShareClassesTable  } from "../../assets/js/components/shareClasses.js";
import { CompanyAlertsWidget } from "../../assets/js/components/companyAlerts.js";
import { ConnectedPlaceholderSearch } from '../../assets/js/components/search.js';
import { ShareClassSelect } from '../../assets/js/components/transactions/applyShareClasses.js';
import Amend, { SubActions } from '../../assets/js/components/transactions/resolvers/amend';
import { Confirmation } from '../../assets/js/components/modals';
import { LoadingOverlay } from '../../assets/js/components/loading';
import Modal from 'react-bootstrap/lib/Modal'

import chai from 'chai';



const should = chai.should();


const navigateClick = (el) => {
    Simulate.click(el, {button: 0});
}


function importCompany(name){
    const dom = this.dom;
    let search;
    return waitFor('Waiting for login confirmation', 'div.welcome-back', dom)
        .then(() => {
            return waitFor('Companies page to load', '.auto-suggest', dom);
        })
        .then(() => {
            search = findRenderedComponentWithType(this.tree, ConnectedPlaceholderSearch);
            const input = findRenderedDOMComponentWithTag(search, 'input');
            Simulate.focus(input);
            input.value = name;
            Simulate.change(input);
            return waitFor('Drop down results to appear', '.suggest-container .list-group-item-heading', dom);
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
}


function setupShareHoldings(){
    let dom = this.dom;
    const alerts = findRenderedComponentWithType(this.tree, CompanyAlertsWidget);
    const setup = findRenderedDOMComponentWithClass(alerts, 'guided-setup-link');
    navigateClick(setup);

    return waitFor('Voter selection to be visible', '.voter-select .btn-primary', this.dom, 10000)
     .then(button => {
        Simulate.click(button);
        return waitFor('Share class page to load', '.create-new', this.dom, 5000)
     })
}

function applyShareClasses(shareClassData){
    let shareClassMap = {}, classes;

    return waitFor('Transaction page to load', '.apply-share-classes', this.dom)
    .then(el => {
        const shareClassSelect = findRenderedComponentWithType(this.tree, ShareClassSelect);
        const tbody = findRenderedDOMComponentWithTag(shareClassSelect, 'tbody');
        const rows = tbody.querySelectorAll('tr');
        const _shareClassData = JSON.parse(JSON.stringify(shareClassData));
        let parcelCount = 0;
        [].map.call(rows, (row, i) => {
            const names = [].map.call(row.querySelectorAll('td:nth-child(2) li'), l => cheerio(l.outerHTML).text());
            const nameString = JSON.stringify(names);
            classes = _shareClassData[nameString].shift();
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
        return waitFor('Parcels to render', () => this.dom.querySelectorAll('.parcel-row').length === parcelCount, null, 1000)
    })
    .then(() => {
        const shareClassSelect = findRenderedComponentWithType(this.tree, ShareClassSelect);
        const tbody = findRenderedDOMComponentWithTag(shareClassSelect, 'tbody');
        const rows = tbody.querySelectorAll('tr');
         const _shareClassData = JSON.parse(JSON.stringify(shareClassData));
        [].map.call(rows, (row, i) => {
            const names = [].map.call(row.querySelectorAll('td:nth-child(2) li'), l => cheerio(l.outerHTML).text());
            const nameString = JSON.stringify(names);
            classes = _shareClassData[nameString].shift();
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
        return waitFor('For import chunk page to display', () => this.dom.querySelectorAll('.submit-import').length, null, 10000);
    });
}

function applyDefaultShareClasses(){
    return waitFor('Transaction page to load', '.apply-share-classes', this.dom)
        .then(() => {
            Simulate.click(findRenderedDOMComponentWithClass(this.tree, 'submit'));
            return waitFor('For import chunk page to display', () => this.dom.querySelectorAll('.submit-import').length, null, 10000);
        });
}

function setupShareClass(name, expected){
    return waitFor('Share class page to load', '.create-new', this.dom)
        .then(el => {
            Simulate.click(el, {button: 0});
            return waitFor('New share class page to load', '.share-class-name', this.dom)
        })
        .then(el => {
            el.value = name;
            Simulate.change(el);
            Simulate.submit(findRenderedDOMComponentWithClass(this.tree, 'share-class-form'));
            return waitFor('Share class page to load again', () => this.dom.querySelectorAll('.share-class-table tr').length === expected, null, 5000)
        })
}



function populateTransfer({fromHolding, toHolding, parcels}){
    return waitFor('Form to load', '.transfer-form', this.dom)
        .then(el => {
            const holdingMap = {};
            const fromSelect = this.dom.querySelector('select[name="from"]');
            const toSelect = this.dom.querySelector('select[name="to"]');
           _.map(fromSelect.children, option => {
                holdingMap[option.innerHTML] = option.value;
            });
            Simulate.change(fromSelect, { target: {value: holdingMap[fromHolding]} });
            Simulate.change(toSelect, { target: {value: holdingMap[toHolding]} });
            const shareClassMap = {};
            const parcelSelect = this.dom.querySelector('select.shareClass');
            _.map(parcelSelect.children, option => {
                 shareClassMap[option.innerHTML] = option.value;
            });
            parcels.map((p, i) => {
                if(i > 0){
                    const addNew = row.querySelector('.add-parcel');
                    Simulate.click(addNew, {button: 0});
                }
                Simulate.change(this.dom.querySelectorAll('.amount')[i], { target: {value: p.amount}});
                Simulate.change(this.dom.querySelectorAll('.shareClass')[i], { target: {value: shareClassMap[p.shareClass]}});

            });
            const submit = this.dom.querySelector('.widget-footer .btn-primary');
            Simulate.click(submit, {button: 0});
            return waitFor('Modal to appear', () => scryRenderedComponentsWithType(this.tree, Confirmation).length, this.dom, 10000)
        })
        .then(() => {
            //const portal = ReactDOM.findDOMNode(findRenderedComponentWithType(this.tree, Confirmation).refs.modal._modal.refs.modal);
            const portal = findRenderedComponentWithType(this.tree, Confirmation).refs.modal._modal.mountNode;
            Simulate.click(portal.querySelector('.btn-primary'), {button: 0});
            return waitFor('Summary to appear', '.transaction-summary', this.dom, 5000)
        })

}




function resolveAmend(details){
    return details.map((detail, i) => {
        const el = this.dom.querySelectorAll('.amend-row')[i];
        detail.map((entry, j) => {
            if(j > 0){
                Simulate.click(el.querySelector('.add-subaction'), {button: 0});
            }
            const subaction = el.querySelectorAll('.amend-subaction')[j];
            Simulate.change(subaction.querySelector('.transaction-type'), { target: {value: entry.type}});
            if(entry.amount !== undefined){
                Simulate.change(subaction.querySelector('.amount'), { target: {value: entry.amount}});
            }
            if(entry.shareClass !== undefined){
                const select = subaction.querySelector('.shareClass');
                const shareClassMap = {};
                _.map(select.children, option => {
                     shareClassMap[option.innerHTML] = option.value;
                });
                Simulate.change(subaction.querySelector('.shareClass'), { target: {value: shareClassMap[entry.shareClass]}});
            }
            if(entry.recipient){
                const targetVal = Array.from(subaction.querySelectorAll('.transfer option')).filter((el) => cheerio(el.outerHTML).text().indexOf(entry.recipient) > -1)[0].value;
                Simulate.change(subaction.querySelector('.transfer'), { target: {value: targetVal}});
                Simulate.blur(subaction.querySelector('.transfer'))
            }
            else{
                const targetVal = Array.from(subaction.querySelectorAll('.subaction-target option')).filter((el) => cheerio(el.outerHTML).text().indexOf(entry.target) > -1)[0].value;
                Simulate.change(subaction.querySelector('.subaction-target'), { target: {value: targetVal}});
                Simulate.blur(subaction.querySelector('.subaction-target'))
            }
        });
    })


}

describe('Company Integration Tests - PROJECT MANAGER HOLDINGS LIMITED', () => {

    before('render',function(){
        return prepareApp.call(this, '/', 'integrate@email.com');
    })

    after('cleanup', destroyApp)

    describe('Import ', () => {

        it('Imports Company', function(){
            return importCompany.call(this, 'PROJECT MANAGER HOLDINGS LIMITED');
        });

        it('sets up shareholdings', function(){
            return setupShareHoldings.call(this);
        });


        it('Sets up shares', function(){
            const linkNode = findRenderedDOMComponentWithClass(this.tree, 'share-classes');
            Simulate.click(linkNode, {button: 0});
            return setupShareClass.call(this, 'Ordinary', 2)
                .then(() => setupShareClass.call(this, 'Preference', 3))
                .then(el => {
                    const table = findRenderedComponentWithType(this.tree, ShareClassesTable);
                    const rows = scryRenderedDOMComponentsWithTag(table, 'tr');
                    rows.length.should.be.equal(3);
                    Simulate.click(findRenderedDOMComponentWithClass(this.tree, 'btn-success'), {button: 0});
                })
        });

        it('Applies share classes', function(){
            return fs.readFileAsync('test/fixtures/transactionData/projectManagerHoldingsTwoShareClasses.json', 'utf8')
                .then(data => {
                    const shareClassData = JSON.parse(data).reduce((acc, item) => {
                        acc[JSON.stringify(item.holders)] = acc[JSON.stringify(item.holders)] || [];
                        acc[JSON.stringify(item.holders)].push(item.parcels);
                        return acc;
                    }, {})
                    return applyShareClasses.call(this, shareClassData);
            })
        });

        it('Imports chunks', function(){
            let modal;
            const button = findRenderedDOMComponentWithClass(this.tree, 'submit-import');
            Simulate.click(button, {button: 0});
            return waitFor('Amend Screen', () => this.dom.querySelectorAll('.resolve').length, null, 10000);
        });

        it('Goes to home page', function(){
            const link = this.dom.querySelectorAll('.breadcrumb a')[1];
           Simulate.click(link, {button: 0});
           return waitFor('Home page to show', '.company-loaded', this.dom, 6000);
        });

        it('Checks warning', function(){
            const link = this.dom.querySelector('.company-alerts .text-danger.alert-entry');
           Simulate.click(link, {button: 0});
           return waitFor('Annual return page to show', '.ar-info', this.dom);
        });

        it('Clicks next', function(){
            const link = this.dom.querySelector('.ar-info .btn-primary');
           Simulate.click(link, {button: 0});
           return waitFor('Annual return page to show', '.ar-review .btn-success', this.dom, 6000);
        });
        it('Clicks submit', function(){
            const input = this.dom.querySelector('.ar-review input[type="checkbox"]');
            Simulate.focus(input);
            input.checked = true;
            Simulate.change(input);
            const submit = this.dom.querySelector('.ar-review .confirm');
            Simulate.click(submit, {button: 0});
           return waitFor('Annual return form to show', '.ar-review-form', this.dom);
        });
    });




});

describe('Company Integration Tests - Catalex', () => {

    before('render', function(){
        return prepareApp.call(this, '/', 'integrate@email.com')
    });

    after('cleanup', destroyApp);

    describe('Import ', () => {
        it('Imports Company', function(){
            return importCompany.call(this, 'catalex');
       });
        it('sets up shareholdings', function(){
            return setupShareHoldings.call(this);
        });
        it('Sets up shares', function(){
            const linkNode = findRenderedDOMComponentWithClass(this.tree, 'share-classes');
            Simulate.click(linkNode, {button: 0});
            return setupShareClass.call(this, 'Class A', 2)
                .then(el => {
                    const table = findRenderedComponentWithType(this.tree, ShareClassesTable);
                    const rows = scryRenderedDOMComponentsWithTag(table, 'tr');
                    rows.length.should.be.equal(2);
                    Simulate.click(findRenderedDOMComponentWithClass(this.tree, 'btn-success'), {button: 0});
                })
        });
        it('Applies share classes', function(){
            return applyDefaultShareClasses.call(this);
        });

        it('Imports chunks', function(){
            let modal;
            const button = findRenderedDOMComponentWithClass(this.tree, 'submit-import');
            Simulate.click(button, {button: 0});
            return waitFor('Amend Screen', () => this.dom.querySelectorAll('.resolve').length, null, 10000);
        });

        it('Resolves import', function(){
            const details = [
                [{type: 'TRANSFER_FROM', amount: 4999, recipient: '#3 - Tamina Kelly CUNNINGHAM-ADAMS and Megan Jean CUNNINGHAM-ADAMS'},
                 {type: 'TRANSFER_FROM', amount: 1, recipient: '#6 - Tamina Kelly CUNNINGHAM-ADAMS'}],
                [{type: 'TRANSFER_FROM', amount: 4999, recipient: '#4 - Thomas David BLOY and Peter James BLOY'},
                 {type: 'TRANSFER_FROM', amount: 1, recipient: '#7 - Thomas David BLOY'}],
                 [], [],
                [{type: 'ISSUE_TO', target: '5 Sep 2014 - Issue of 1,111 shares'}],
            ]

            return waitFor('Amend page to load', '.amend-row', this.dom, 5000)
                .then(() => {
                    return resolveAmend.call(this, details);
                })
                .then(() => {
                    return waitFor('Validation', () => !this.dom.querySelector('.amend-submit').disabled, null, 1000)
                })
                .then(() => {
                    Simulate.submit(this.dom.querySelector('.resolve form'));
                     //Simulate.click(this.dom.querySelector('.amend-submit'), {button: 0});
                     //return waitFor('For import chunk page to display again', () => this.dom.querySelectorAll('.loaded .submit-import').length, null, 20000);
                })
        });

        it('Imports next chunks', function(){
            /*let modal;
            const button = findRenderedDOMComponentWithClass(this.tree, 'submit-import');
            Simulate.click(button, {button: 0});*/
            return waitFor('Amend Screen', () => this.dom.querySelectorAll('.resolve').length, null, 20000)
        })


        it('Resolves import again', function(){
            const details = [
                [{type: 'ISSUE_TO', amount: 4500, target: '1 Aug 2014 - Issue of 9,000 shares'},
                {type: 'TRANSFER_TO', amount: 500, recipient: '#4 - Thomas David BLOY'}],

                [{type: 'ISSUE_TO', amount: 4500, target: '1 Aug 2014 - Issue of 9,000 shares'},
                {type: 'TRANSFER_TO', amount: 500, recipient: '#3 - Tamina Kelly CUNNINGHAM-ADAMS'}]
            ];

            return waitFor('Amend page to load', '.amend-row', this.dom, 5000)
                .then(() => {
                    return resolveAmend.call(this, details);
                })
                .then(() => {
                    return waitFor('Validation', () => !this.dom.querySelector('.amend-submit').disabled, null, 1000)
                })
                .then(() => {
                    Simulate.submit(this.dom.querySelector('.resolve form'));
                     //Simulate.click(this.dom.querySelector('.amend-submit'), {button: 0});
                    // return waitFor('For import chunk page to display again', () => this.dom.querySelectorAll('.loaded .submit-import').length, null, 20000);
                });
            })


        it('Imports final chunks', function(){
            /*let modal;
            const button = findRenderedDOMComponentWithClass(this.tree, 'submit-import');
            Simulate.click(button, {button: 0});*/
            return  waitFor('Import to complete', () => this.dom.querySelectorAll('.congratulations').length, null, 20000);
        });


    });

});



describe('Company Integration Tests - Evolution Lawyers', () => {

    before('render', function(){
        return prepareApp.call(this, '/')
    });

    after('cleanup', destroyApp);

    describe('Import ', () => {
        it('Imports Company', function(){
            return importCompany.call(this, 'evolution lawyers');
        });

        it('sets up shareholdings', function(){
            return setupShareHoldings.call(this);
        });

        it('Sets up shares', function(){
            const linkNode = findRenderedDOMComponentWithClass(this.tree, 'share-classes');
            Simulate.click(linkNode, {button: 0});
            return setupShareClass.call(this, 'A', 2)
                .then(() => setupShareClass.call(this, 'B', 3))
                .then(el => {
                    const table = findRenderedComponentWithType(this.tree, ShareClassesTable);
                    const rows = scryRenderedDOMComponentsWithTag(table, 'tr');
                    rows.length.should.be.equal(3);
                    Simulate.click(findRenderedDOMComponentWithClass(this.tree, 'btn-success'), {button: 0});
                })
        });

        it('Applies share classes', function(){
            return fs.readFileAsync('test/fixtures/transactionData/evolutionShareClasses.json', 'utf8')
                .then(data => {
                    const shareClassData = JSON.parse(data).reduce((acc, item, i) => {
                        acc[JSON.stringify(item.holders)] = acc[JSON.stringify(item.holders)] || [];
                        acc[JSON.stringify(item.holders)].push(item.parcels);
                        return acc;
                    }, {})
                    return applyShareClasses.call(this, shareClassData);
            })
        });

        it('Imports chunks', function(){
            let modal;
            const button = findRenderedDOMComponentWithClass(this.tree, 'submit-import');
            Simulate.click(button, {button: 0});
            return waitFor('Amend Screen', () => this.dom.querySelectorAll('.resolve').length, null, 10000);
        });

        it('Resolves import', function(){
            const details = [
                [{type: 'TRANSFER_TO', amount: 50, shareClass: 'B', recipient: '#3 - Tamina Kelly CUNNINGHAM-ADAMS'}],
                [{type: 'TRANSFER_FROM', amount: 50, shareClass: 'A', recipient: '#4 - Thomas David BLOY'}]
            ];

            return waitFor('Amend page to load', '.amend-row', this.dom, 5000)
                .then(() => {
                    return resolveAmend.call(this, details);
                })
                .then(() => {
                    return waitFor('Validation', () => !this.dom.querySelector('.amend-submit').disabled, null, 1000)
                })
                .then(() => {
                    Simulate.submit(this.dom.querySelector('.resolve form'));
                });
        });

        it('Imports final chunks', function(){
            return  waitFor('Import to complete', () => this.dom.querySelectorAll('.congratulations').length, null, 20000);
        });

        it('Views transaction page', function(){
            const link = this.dom.querySelector('a.dashboard');
            Simulate.click(link, {button: 0});
            return  waitFor('Landing page to load', () => this.dom.querySelectorAll('.company-loaded').length, null, 2000)
            .then(() => {
                const link = this.dom.querySelector('.company-transactions a');
                Simulate.click(link, {button: 0});
                return  waitFor('Transactions to load', () => this.dom.querySelectorAll('.widget-body table tbody tr').length, null, 2000)
            })
            .then(rows => {
                let index = 0;
                return UtilService.promiseWhile(() => {
                    return index < rows
                }, () => {
                    const link = this.dom.querySelectorAll('.widget-body table tbody tr')[index++];
                    Simulate.click(link, {button: 0});
                    return waitFor('Transaction to render', () => this.dom.querySelectorAll('.transaction-return').length, null, 5000)
                    .then(() => {
                        const link = this.dom.querySelectorAll('.transaction-return')[0];
                        Simulate.click(link, {button: 0});
                        return waitFor('Transactions to load', () => this.dom.querySelectorAll('.widget-body table tbody tr').length, null, 2000);
                    });
                })
            });
        });

        it('Views documents page', function(){
            const link = this.dom.querySelector('a.dashboard');
            Simulate.click(link, {button: 0});
            return  waitFor('Landing page to load', () => this.dom.querySelectorAll('.company-loaded').length, null, 2000)
            .then(() => {
                const link = this.dom.querySelector('.company-documents > a');
                Simulate.click(link, {button: 0});
                return  waitFor('Documents to load', () => this.dom.querySelectorAll('.documents .file-tree').length, null, 5000)
            })
        });

        it('Views share register', function(){
            const link = this.dom.querySelector('.share-register a');
            Simulate.click(link, {button: 0});
             return waitFor('Share register to display', () => this.dom.querySelectorAll('.share-register-document .transaction-history').length, null, 2000)
        });

        it('Views interest register', function(){
            const link = this.dom.querySelector('.interests-register a');
            Simulate.click(link, {button: 0});
             return waitFor('Interest register to display', () => this.dom.querySelectorAll('.interests-register-table').length, null, 2000)
        });

        it('Views director register', function(){
            const link = this.dom.querySelector('.director-register a');
            Simulate.click(link, {button: 0});
             return waitFor('Director register to display', () => this.dom.querySelectorAll('.directors-register-document').length, null, 2000)
        });

        it('Views shareholdings page', function(){
            const link = this.dom.querySelector('a.dashboard');
            Simulate.click(link, {button: 0});
            return  waitFor('Landing page to load', () => this.dom.querySelectorAll('.company-loaded').length, null, 2000)
            .then(() => {
                const link = this.dom.querySelector('.shareholding-widget> a');
                Simulate.click(link, {button: 0});
                return  waitFor('Shareholding page to load', () => this.dom.querySelectorAll('.shareholding').length === 4, null, 5000)
            });
        });

        it('Views directors page', function(){
            const link = this.dom.querySelector('a.dashboard');
            Simulate.click(link, {button: 0});
            return  waitFor('Landing page to load', () => this.dom.querySelectorAll('.company-loaded').length, null, 2000)
            .then(() => {
                const link = this.dom.querySelector('.directors-widget> a');
                Simulate.click(link, {button: 0});
                return  waitFor('Directors page to load', () => this.dom.querySelectorAll('.director').length === 2, null, 5000)
            });
        });

        it('Views all templates', function(){
            const link = this.dom.querySelector('a.templates');
            Simulate.click(link, {button: 0});
            return  waitFor('Templates to load', () => this.dom.querySelectorAll('.actionable.select-button').length, null, 2000)
            .then(rows => {
                let index = 0;
                return UtilService.promiseWhile(() => {
                    return index < rows
                }, () => {
                    const link = this.dom.querySelectorAll('.actionable.select-button')[index++];
                    Simulate.click(link, {button: 0});
                    return waitFor('Template form to render', () => this.dom.querySelectorAll('.generated-form').length, null, 5000)
                    .then(() => {
                        const link = this.dom.querySelector('a.templates');
                        Simulate.click(link, {button: 0});
                        return  waitFor('Templates to load', () => this.dom.querySelectorAll('.actionable.select-button').length, null, 2000)
                    });
                })
            });
        });

       it('Views all contact updates', function(){
             const link = this.dom.querySelector('.update-contact a');
            Simulate.click(link, {button: 0});
            return waitFor('For transaction page to display', () => this.dom.querySelectorAll('.actionable.select-button').length, null, 2000)
            .then(rows => {
                let index = 0;
                return UtilService.promiseWhile(() => {
                    return index < rows
                }, () => {
                    const link = this.dom.querySelectorAll('.actionable.select-button')[index++];
                    Simulate.click(link, {button: 0});
                    return waitFor('Transaction form to render', () => this.dom.querySelectorAll('.transaction-views .button-row .btn.btn-default').length, null, 5000)
                    .then(() => {
                        const link = _.last(this.dom.querySelectorAll('.transaction-views .button-row .btn.btn-default'));
                        Simulate.click(link, {button: 0});
                        return  waitFor('Transactions to load', () => this.dom.querySelectorAll('.actionable.select-button').length, null, 5000)
                    });
                })
            });
        });

       it('Views all person updates', function(){
             const link = this.dom.querySelector('.update-people a');
            Simulate.click(link, {button: 0});
            return waitFor('For transaction page to display', () => this.dom.querySelectorAll('.actionable.select-button').length, null, 2000)
            .then(rows => {
                let index = 0;
                return UtilService.promiseWhile(() => {
                    return index < rows
                }, () => {
                    const link = this.dom.querySelectorAll('.actionable.select-button')[index++];
                    Simulate.click(link, {button: 0});
                    return waitFor('Transaction form to render', () => this.dom.querySelectorAll('.transaction-views .button-row .btn.btn-default').length, null, 5000)
                    .then(() => {
                        const link = _.last(this.dom.querySelectorAll('.transaction-views .button-row .btn.btn-default'));
                        Simulate.click(link, {button: 0});
                        return  waitFor('Transactions to load', () => this.dom.querySelectorAll('.actionable.select-button').length, null, 5000)
                    });
                })
            });
        });

       it('Views all manage company updates', function(){
             const link = this.dom.querySelector('.update-manage a');
            Simulate.click(link, {button: 0});
            return waitFor('For transaction page to display', () => this.dom.querySelectorAll('.actionable.select-button').length, null, 2000)
            .then(rows => {
                let index = 0;
                return UtilService.promiseWhile(() => {
                    return index < rows
                }, () => {
                    const link = this.dom.querySelectorAll('.actionable.select-button')[index++];
                    Simulate.click(link, {button: 0});
                    return waitFor('Transaction form to render', () => this.dom.querySelectorAll('.transaction-views .button-row .btn.btn-default').length, null, 5000)
                    .then(() => {
                        const link = _.last(this.dom.querySelectorAll('.transaction-views .button-row .btn.btn-default'));
                        Simulate.click(link, {button: 0});
                        return  waitFor('Transactions to load', () => this.dom.querySelectorAll('.actionable.select-button').length, null, 5000)
                    });
                })
            });
        });

       it('Views all share updates', function(){
             const link = this.dom.querySelector('.update-shares a');
            Simulate.click(link, {button: 0});
            return waitFor('For transaction page to display', () => this.dom.querySelectorAll('.actionable.select-button').length, null, 2000)
            .then(rows => {
                let index = 0;
                return UtilService.promiseWhile(() => {
                    return index < rows
                }, () => {
                    const link = this.dom.querySelectorAll('.actionable.select-button')[index++];
                    Simulate.click(link, {button: 0});
                    return waitFor('Transaction form to render', () => this.dom.querySelectorAll('.transaction-views .button-row .btn.btn-default').length, null, 5000)
                    .then(() => {
                        const link = _.last(this.dom.querySelectorAll('.transaction-views .button-row .btn.btn-default'));
                        Simulate.click(link, {button: 0});
                        return  waitFor('Transactions to load', () => this.dom.querySelectorAll('.actionable.select-button').length, null, 5000)
                    });
                })
            });
        });

       it('Views all share updates', function(){
             const link = this.dom.querySelector('.update-shares a');
            Simulate.click(link, {button: 0});
            return waitFor('For transaction page to display', () => this.dom.querySelectorAll('.actionable.select-button').length, null, 2000)
            .then(rows => {
                let index = 0;
                return UtilService.promiseWhile(() => {
                    return index < rows
                }, () => {
                    const link = this.dom.querySelectorAll('.actionable.select-button')[index++];
                    Simulate.click(link, {button: 0});
                    return waitFor('Transaction form to render', () => this.dom.querySelectorAll('.transaction-views .button-row .btn.btn-default').length, null, 5000)
                    .then(() => {
                        const link = _.last(this.dom.querySelectorAll('.transaction-views .button-row .btn.btn-default'));
                        Simulate.click(link, {button: 0});
                        return  waitFor('Transactions to load', () => this.dom.querySelectorAll('.actionable.select-button').length, null, 5000)
                    });
                })
            });
        });


        it('Does a transfer', function(){
            const link = this.dom.querySelector('.update-shares a');
            Simulate.click(link, {button: 0});
            return waitFor('For transaction page to display', () => this.dom.querySelectorAll('.new-transaction').length, null, 2000)
            .then(() => {
                const link = this.dom.querySelector('.actionable.transfer');
                Simulate.click(link, {button: 0});
                //return waitFor('For transfer form display', () => this.dom.querySelectorAll('.generated-form form-horizontal').length, null, 2000)
                return waitFor('For transfer form display', () => this.dom.querySelectorAll('.transfer-form').length, null, 2000)
            })
            .then(() => {
                return populateTransfer.call(this, {
                    fromHolding: "Shareholding 1:  Tamina Kelly CUNNINGHAM-ADAMS",
                    toHolding: "Shareholding 2:  Tamina Kelly CUNNINGHAM-ADAMS",
                    parcels: [{amount: 1, shareClass: 'A'}]
                })
            })
        });

        it('Goes to template page', function(){
           const generate = this.dom.querySelector('.btn.btn-primary');
           Simulate.click(generate, {button: 0});
           return waitFor('Template page to appear', '.generated-form', this.dom);
        });





        /*it('Generates transfer document', function(){
            return waitFor('template to validate', '.email-document:not(:disabled)', this.dom, 10000 )
            .then(() => {
                const generate = this.dom.querySelector('.btn.btn-primary');
               return waitFor('Loading modal to appear', !!scryRenderedComponentsWithType(this.tree, LoadingOverlay).length, this.dom)
            })
            .then(() => waitFor('Loading modal to disappear', !scryRenderedComponentsWithType(this.tree, LoadingOverlay.length, this.dom)))
           //Simulate.click(generate, {button: 0});
        })*/


    });



});
