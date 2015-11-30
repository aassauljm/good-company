"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import {reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { fieldStyle, fieldHelp, requiredFields, formFieldProps, formProxyable, formProxy } from '../utils';
import { pushState } from 'redux-router';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';




export class TransactionViewModal extends React.Component {

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
                { this.props.index > 0 && !this.props._status !== 'fetching' && <Button onClick={this.props.previous} bsStyle="primary">Previous</Button> }
              </Modal.Footer>
            </Modal>
    }

}