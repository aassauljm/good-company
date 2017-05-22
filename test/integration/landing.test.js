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

describe('Landing Integration tests', () => {

    before('render', function(){
        return prepareApp.call(this, '/', 'integrate-landing@email.com');
    });

    after('cleanup', destroyApp)

    describe('Visits each page ', () => {


        it('Calendar', function(){
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

        });


    });



});
