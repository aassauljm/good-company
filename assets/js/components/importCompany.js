"use strict";
import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import {createResource, addNotification, companyTransaction} from '../actions';
import {reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { fieldStyle, fieldHelp, requiredFields, formFieldProps, formProxyable, formProxy } from '../utils';
import { pushState } from 'redux-router';
import LookupCompany from './lookupCompany';




export default class ImportCompanyModal extends React.Component {

    handleNext() {
        if(this.props.index < this.pages.length -1){
            this.props.next();
        }
    };

    pages = [
        function(){
            return  <LookupCompany />
        }

    ];

    render() {
        const valid = false;
        return  <Modal show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Import from the New Zealand Companies Office</Modal.Title>
              </Modal.Header>

              <Modal.Body>
                {this.pages[this.props.index].call(this) }
              </Modal.Body>

              <Modal.Footer>
                <Button onClick={this.props.end} >Close</Button>
                { this.props.index > 0 && <Button onClick={this.props.previous} bsStyle="primary">Previous</Button> }

                 <Button onClick={::this.handleNext} disabled={!valid} bsStyle="primary">{ this.props.index < this.pages.length -1 ? 'Next' : 'Import' }</Button>
              </Modal.Footer>
            </Modal>
    }
}
