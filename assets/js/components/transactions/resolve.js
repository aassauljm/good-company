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




@connect((state, ownProps) => {
    return {
    };
}, (dispatch, ownProps) => {
    return {
        addNotification: (args) => dispatch(addNotification(args))
    }
})
export class ResolveAmbiguityModal extends React.Component {

    constructor(props){
        super(props);
    }

    renderBody() {
        const companyName = this.props.modalData.companyState.companyName;
        const context = this.props.modalData.error.context || {};

        const documentId =  context.actionSet && context.actionSet.data.documentId;
        const documentUrl = documentId && companiesOfficeDocumentUrl(this.props.modalData.companyState, documentId);
           return <div>
            <p className="text-danger">Could not import from { companyName }.</p>
            <p className="text-danger">Reason: {this.props.modalData.error.message}</p>
            { documentId && <p>Source: <Link target="_blank" to={documentUrl}>Companies Office document {documentId}</Link></p> }
            </div>
    }

    renderFooter(){
        return
    }


    handleResolve() {
        this.props.showResolve(this.props.modalData);
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
            <div className="button-row">
            <Button onClick={this.props.end} >Cancel</Button>
            </div>
              </Modal.Footer>
            </Modal>
    }
}
