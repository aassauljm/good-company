"use strict";
import React, { PropTypes } from 'react';
import { requestResource, showModal } from '../../actions';
import { pureRender, stringToDate } from '../../utils';
import { connect } from 'react-redux';
import ButtonInput from '../forms/buttonInput';
import Button from 'react-bootstrap/lib/Button';
import { Link } from 'react-router'
import STRINGS from '../../strings'
import { asyncConnect } from 'redux-connect';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { push } from 'react-router-redux'
import Modal from '../forms/modal';


@connect((state, ownProps) => {
    return state.resources[`/company/${ownProps.modalData.companyId}/pending_history`] || {};
}, (dispatch, ownProps) => {
    return {
        requestData: (key) => dispatch(requestResource(`/company/${key}/pending_history`)),
        startHistoryImport: () => {
            dispatch(showModal('importHistory', {companyState: ownProps.companyState, companyId: ownProps.companyId}));
            dispatch(push(`/company/view/${ownProps.companyId}/new_transaction`));
        },
        navigate: (url) => dispatch(push(url))
    }
})
export class ImportHistoryModal extends React.Component {

    fetch() {
        return this.props.requestData(this.props.modalData.companyId);
    };

    componentDidMount() {
        this.fetch();
    };

    componentDidUpdate() {
        this.fetch();
    };

    renderBody() {

        if(this.props._status === 'fetching'){
            return <div className="loading"> <Glyphicon glyph="refresh" className="spin"/></div>
        }
        if(this.props._status === 'complete'){
            return <div><p>There are total of { this.props.data.actions.length } historic documents from the Companies Office to import.</p>
            <p>Good Company can usually understand the transactions in these documents, but may need your input to resolve any ambiguities.  </p>
            <p>If you are unable to provide the requested details, don't worry - you can come back at any point and continue where you left off. </p>
            <div className="button-row">
                <ButtonInput bsStyle="primary" onClick={this.props.startHistoryImport}>Start Importing Company History</ButtonInput>
            </div>
            </div>
        }
    }


    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Issue Shares</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                { this.renderBody() }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.handleClose} >Close</Button>
                 <Button onClick={this.handleNext} bsStyle="primary">{ 'Submit' }</Button>
              </Modal.Footer>
            </Modal>
    }
}
