"use strict";
import React, { PropTypes } from 'react';
import { requestResource, createResource, showModal, addNotification } from '../../actions';
import { pureRender, stringToDate } from '../../utils';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import { Link } from 'react-router'
import STRINGS from '../../strings'
import { asyncConnect } from 'redux-connect';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { push } from 'react-router-redux'
import Modal from '../forms/modal';
import { enums as ImportErrorTypes } from '../../../../config/enums/importErrors';


function companiesOfficeDocumentUrl(companyState, documentId){
    const companyNumber = companyState.companyNumber;
    return `http://www.business.govt.nz/companies/app/ui/pages/companies/${companyNumber}/${documentId}/entityFilingRequirement`;
}

const INTRODUCTION = 0;
const LOADING = 1;
const FEEDBACK = 2;
const FINISHED = 3;

const PAGES = [];

PAGES[INTRODUCTION] = function() {
        if(this.props.pendingHistory._status === 'fetching'){
            return <div className="loading"> <Glyphicon glyph="refresh" className="spin"/></div>
        }
        if(this.props.pendingHistory._status === 'complete'){
            return <div><p>There are total of { this.props.pendingHistory.data.length } historic documents from the Companies Office to import.</p>
            <p>Good Company can usually understand the transactions in these documents, but may need your input to resolve any ambiguities.  </p>
            <p>If you are unable to provide the requested details, don't worry - you can come back at any point and continue where you left off. </p>
            </div>
        }
    };

PAGES[LOADING] = function() {
    console.log(this.props)
        if(this.props.importHistory._status === 'fetching'){
            return <div className="loading"> <Glyphicon glyph="refresh" className="spin"/></div>
        }
        else if(this.props.importHistory._status === 'complete' && !this.props.modalData.companyState.warnings.pendingHistory){
           return <div><p>All Companies Office documents have successfully been imported.</p></div>
        }
        else if(this.props.importHistory._status === 'error'){
            const companyName = this.props.modalData.companyState.companyName;
            const context = this.props.importHistory.error.context || {};

            const documentId =  context.actionSet && context.actionSet.data.documentId;
            const documentUrl = documentId && companiesOfficeDocumentUrl(this.props.modalData.companyState, documentId);
           return <div>
            <p className="text-danger">Could not import from { companyName }.</p>
            <p className="text-danger">Reason: {this.props.importHistory.error.message}</p>
            { documentId && <p>Source: <Link target="_blank" to={documentUrl}>Companies Office document {documentId}</Link></p> }
            </div>
        }
    };

@connect((state, ownProps) => {
    return {
        pendingHistory: state.resources[`/company/${ownProps.modalData.companyId}/pending_history`] || {},
        importHistory: state.resources[`/company/${ownProps.modalData.companyId}/import_pending_history`] || {}
    };
}, (dispatch, ownProps) => {
    return {
        requestData: () => dispatch(requestResource(`/company/${ownProps.modalData.companyId}/pending_history`)),
        performImport: () => dispatch(createResource(`/company/${ownProps.modalData.companyId}/import_pending_history`,
                                                     {
                                                        invalidates: [`/company/${ownProps.modalData.companyId}`]
                                                     })),
        addNotification: (args) => dispatch(addNotification(args))
    }
})
export class ImportHistoryModal extends React.Component {

    constructor(props){
        super(props);
        this.handleNext = ::this.handleNext;
    }

    fetch() {
        return this.props.requestData();
    };

    componentDidMount() {
        this.fetch();
    };

    componentDidUpdate() {
        this.fetch();
    };

    renderBody() {
        return PAGES[this.props.index].call(this)
    }

    handleNext() {
        if(this.props.index === INTRODUCTION){
            this.props.next({index: LOADING});
            this.props.performImport()
                .catch(e => {
                    const companyName = this.props.modalData.companyState.companyName;
                    this.props.addNotification({error: true, message: `An issue found while trying to import history for ${companyName}`})
                })
        }
    }

    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Import Company History</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                { this.renderBody() }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.props.end} >Close</Button>
                 <Button onClick={this.handleNext} bsStyle="primary">Start Importing Company History</Button>
              </Modal.Footer>
            </Modal>
    }
}