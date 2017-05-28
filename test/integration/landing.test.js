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
} from 'react-dom/test-utils';
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

describe('Landing Integration tests', () => {

    before('render', function(){
        return prepareApp.call(this, '/', 'integrate-landing@email.com');
    });

    after('cleanup', destroyApp)

    describe('Visits each page ', () => {


        it('Explores Calendar', function(){
            const linkNode = this.dom.querySelector('.calendar-widget > a');
            Simulate.click(linkNode, {button: 0});
            return waitFor('calendar page to show',  () => this.dom.querySelectorAll('.calendar-big').length, null, 5000)
                .then(() => {
                   const linkNode = this.dom.querySelector('.create-event')
                   Simulate.click(linkNode, {button: 0});
                   return waitFor('calendar form to show',  () => this.dom.querySelectorAll('.calendar-full form').length, null, 5000);
                })
                .then(() => {
                    const input = this.dom.querySelector('.calendar-full .event-title')
                    Simulate.focus(input);
                    input.value = 'test event';
                    Simulate.change(input);
                    const linkNode = this.dom.querySelector('.btn-primary')
                    Simulate.click(linkNode, {button: 0});
                    return waitFor('calendar page to show',  () => this.dom.querySelectorAll('.calendar-big').length, null, 5000);
                })
                .then(() => {
                    return waitFor('summary to show', () => this.dom.querySelectorAll('.summary').length, null, 5000)
                })
                .then(() => {
                    this.dom.querySelector('.summary .title').innerHTML.should.be.equal('test event');
                   const linkNode = this.dom.querySelector('.summary .controls .edit-event')
                   Simulate.click(linkNode, {button: 0});
                   return waitFor('edit to show', () => this.dom.querySelector('.calendar-full .event-title'), 2000)
                })
                .then(() => {
                    const input = this.dom.querySelector('.calendar-full .event-title')
                    Simulate.focus(input);
                    input.value = 'test event editted';
                    Simulate.change(input);
                    const linkNode = this.dom.querySelector('.btn-primary')
                    Simulate.click(linkNode, {button: 0});
                    return waitFor('calendar page to show',  () => this.dom.querySelectorAll('.calendar-big').length, null, 5000);
                })
                .then(() => {
                    return waitFor('summary to show', () => this.dom.querySelectorAll('.summary').length, null, 5000)
                })
                .then(() => {
                    this.dom.querySelector('.summary .title').innerHTML.should.be.equal('test event editted');
                   const linkNode = this.dom.querySelector('.summary .controls .delete-event')
                    Simulate.click(linkNode, {button: 0});
                    return waitFor('summary to disappear', () => this.dom.querySelectorAll('.summary').length === 0, null, 5000)
                })
                .then(() => {
                    const linkNode = this.dom.querySelectorAll('.breadcrumb a')[0]
                    Simulate.click(linkNode, {button: 0});
                    return waitFor('home page', () => this.dom.querySelectorAll('.home').length)
                });
        });


        it('Explores Companies', function(){
            const linkNode = this.dom.querySelector('.companies-widget > a');
            Simulate.click(linkNode, {button: 0});
            return waitFor('companies page to show',  () => this.dom.querySelectorAll('.company-list-body tbody tr').length, null, 5000)
                .then(() => {
                    const linkNode = this.dom.querySelector('a.manage-companies');
                    Simulate.click(linkNode, {button: 0});
                    return waitFor('companies page to show',  () => this.dom.querySelectorAll('.company-list-body tbody tr input').length, null, 5000)
                })
                .then(() => {
                    const linkNode = this.dom.querySelectorAll('.breadcrumb a')[0]
                    Simulate.click(linkNode, {button: 0});
                    return waitFor('home page', () => this.dom.querySelectorAll('.home').length)
                });
        });

        it('Explores Notifications', function(){
            const linkNode = this.dom.querySelector('.alerts-widget > a');
            Simulate.click(linkNode, {button: 0});
            return waitFor('alerts page to show',  () => this.dom.querySelectorAll('.guided-setup-link').length, null, 5000)
                .then(() => {
                    const linkNode = this.dom.querySelectorAll('.breadcrumb a')[0]
                    Simulate.click(linkNode, {button: 0});
                    return waitFor('home page', () => this.dom.querySelectorAll('.home').length)
                });
        });

        it('Explores Recent Activity', function(){
            const linkNode = this.dom.querySelector('.recent-activity-widget > a');
            Simulate.click(linkNode, {button: 0});
            return waitFor('recent activity page to show',  () => this.dom.querySelectorAll('.recent-activity-table').length, null, 5000)
                .then(() => {
                    const linkNode = this.dom.querySelectorAll('.breadcrumb a')[0]
                    Simulate.click(linkNode, {button: 0});
                    return waitFor('home page', () => this.dom.querySelectorAll('.home').length)
                });
        });

        it('Explores Templates', function(){
            const linkNode = this.dom.querySelector('.templates-widget > a');
            Simulate.click(linkNode, {button: 0});
            return waitFor('templates page to show',  () => this.dom.querySelectorAll('.widget .search-form').length, null, 5000)
                .then(() => {
                    const linkNode = this.dom.querySelectorAll('.breadcrumb a')[0]
                    Simulate.click(linkNode, {button: 0});
                    return waitFor('home page', () => this.dom.querySelectorAll('.home').length)
                });
        });
        it('Explores Import Menu', function(){
            const linkNode = this.dom.querySelector('.import-widget .bulk-import');
            Simulate.click(linkNode, {button: 0});
            return waitFor('import page to show',  () => this.dom.querySelectorAll('.import-full-widget .auto-suggest').length, null, 5000)
                .then(() => {
                    const linkNode = this.dom.querySelectorAll('.breadcrumb a')[0]
                    Simulate.click(linkNode, {button: 0});
                    return waitFor('home page', () => this.dom.querySelectorAll('.home').length)
                });
        });

        it('Explores Organisation page', function(){
            const linkNode = this.dom.querySelector('.organisation-widget > a');
            Simulate.click(linkNode, {button: 0});
            return waitFor('organiastion page to show',  () => this.dom.querySelectorAll('.widget select').length, null, 5000)
                .then(() => {
                    const linkNode = this.dom.querySelectorAll('.breadcrumb a')[0]
                    Simulate.click(linkNode, {button: 0});
                    return waitFor('home page', () => this.dom.querySelectorAll('.home').length)
                });
        });
    });



});
