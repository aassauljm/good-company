"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import {importCompany, addNotification, requestResource } from '../actions';
import {reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { fieldStyle, fieldHelp, requiredFields, formFieldProps, formProxyable, formProxy } from '../utils';
import { routeActions } from 'react-router-redux'
import LookupCompany from './lookupCompany';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';



@connect(state => ({importCompany: state.importCompany}))
export default class ImportCompanyModal extends React.Component {
    static propTypes = {
        next: PropTypes.func.isRequired,
        previous: PropTypes.func.isRequired,
        end: PropTypes.func.isRequired
    };

    pages = [
        function(){
            return  <LookupCompany next={this.props.next}/>
        },
        function(){
            return <div className="well">
                <dl className="dl-horizontal">
                    <dt >Company Name</dt>
                    <dd >{this.props.modalData.companyName}</dd>
                    <dt >Company Number</dt>
                    <dd >{this.props.modalData.companyNumber}</dd>
                    <dt >Status</dt>
                    <dd >{this.props.modalData.struckOff ? 'Struck Off': 'Registered'}</dd>
                    <dt >Notes</dt>
                    <dd >{ (this.props.modalData.notes || []).map((note, i) => {
                            return <span key={i}>{note}</span>
                        }) }</dd>
                    </dl>
                    <div className="text-center">
                        <Button bsStyle="primary" onClick={::this.importCompany} >Import this Company</Button>
                        </div>
            </div>
        },
        function(){
            return <div>
                <div className="text-center">Importing Company.  This may take a few moments...</div>
                <div className="loading"> <Glyphicon glyph="refresh" className="spin"/></div>
                </div>
        }

    ];
    importCompany(){
        this.props.next();
        this.props.dispatch(importCompany(this.props.modalData.companyNumber))
            .then((result = {response: {message: 'No connection'}}) => {
                if(result.error){
                    this.props.dispatch(addNotification({message: `Could not import company, Reason: ${result.response.message}`, error: true}));
                    this.props.end();
                }
                else{
                    this.props.dispatch(addNotification({message: 'Company Imported'}));
                    this.props.dispatch(requestResource('companies', {refresh: true}));
                    this.props.dispatch(routeActions.push('/company/view/'+result.response.id))
                    this.props.end();
                }
            });
    };
    componentWillUnmount() {
        this.refs.modal._onHide();
    }
    render() {
        const valid = false;
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
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
