"use strict";
import React, {PropTypes} from 'react';
import Modal from '../forms/modal';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from '../forms/buttonInput';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from '../forms/input';
import { Link } from 'react-router';
import { companyTransaction, addNotification, showModal } from '../../actions';
import STRINGS from '../../strings';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';



@connect(undefined)
export class SelectionBase extends React.Component {
    constructor(props) {
        super(props);
        this.submit = ::this.submit;
        this.handleClose = ::this.handleClose;
        this.handleNext = ::this.handleNext;
    }

    handleNext() {
        this.refs.form.submit();
    }

    handleClose(data={}) {
        this.props.end(data);
    }

    renderBody() {
        return <div className="new-transaction">
         <div className="row">
            { this.props.children }
        </div>
        </div>
    }

    show(key) {
        this.props.showModal(key, {companyState: this.props.companyState, companyId: this.props.companyId, afterClose: {location: this.props.location.pathname}});
    }

    submit(values) {

    }

    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>{ this.props.title }</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                { this.renderBody() }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
              </Modal.Footer>
            </Modal>
    }

}

export class AddAssignSharesModal extends React.Component {

    render() {
        return <SelectionBase {...this.props} title="Add and Assign Shares">
            <div className="actionable select-button"  onClick={() => {
                    this.props.navigate({pathname: `/company/view/${this.props.modalData.companyId}/share_classes`, state: {skipDirtyLeave: true}});
                    this.props.end();
                }} >
                <span className="glyphicon glyphicon-envelope"></span>
                <span className="transaction-button-text">Manage Share Classes</span>
            </div>
            <div className="actionable select-button" onClick={() => this.props.show('applyShareClasses')} >
                    <span className="glyphicon glyphicon-list-alt"></span>
                    <span className="transaction-button-text">Apply Share Classes</span>
            </div>

        </SelectionBase>
    }
}




export class ConsolidateDivideModal extends React.Component {

    render() {
        return <SelectionBase {...this.props} title="Consolidate or Divide Shares">
            <div className="actionable select-button"  onClick={() => this.props.show('consolidation')} >
                <span className="glyphicon glyphicon-envelope"></span>
                <span className="transaction-button-text">Consolidation of Shares</span>
            </div>
            <div className="actionable select-button" onClick={() => this.props.show('subdivision')} >
                <span className="glyphicon glyphicon-resize-full"></span>
                <span className="transaction-button-text">Subdivision of Shares</span>
            </div>
        </SelectionBase>
    }
}

export class RepurchaseRedeemModal extends React.Component {

    render() {
        return <SelectionBase {...this.props} title="Repurchase or Redeem Shares">
            <div className="actionable select-button"  onClick={() => this.props.show('purchase')} >
                <span className="glyphicon glyphicon-usd"></span>
                <span className="transaction-button-text">Repurchase of Shares</span>

            </div>
            <div className="actionable select-button" onClick={() => this.props.show('redemption')} >
                <span className="glyphicon glyphicon-import"></span>
                <span className="transaction-button-text">Redemption of Shares</span>
            </div>
        </SelectionBase>
    }
}

export class UpdateHoldingHolderModal extends React.Component {

    render() {
        return <SelectionBase {...this.props} title="Update Shareholdings and Shareholders">
            <div className="actionable select-button"  onClick={() => this.props.show('selectHolding')} >
                <span className="glyphicon glyphicon-briefcase"></span>
                <span className="transaction-button-text">Update Shareholding</span>

            </div>
            <div className="actionable select-button" onClick={() => this.props.show('selectPerson')} >
                <span className="glyphicon glyphicon-user"></span>
                <span className="transaction-button-text">Update Shareholder</span>
            </div>
            <div className="actionable select-button" onClick={() => this.props.show('selectHistoricPerson')} >
                <span className="glyphicon glyphicon-hourglass"></span>
                <span className="transaction-button-text">Update Historic Shareholder</span>
            </div>
        </SelectionBase>
    }
}


export class ResetDeleteModal extends React.Component {

    render() {
        return <SelectionBase {...this.props} title="Update Shareholdings and Shareholders">
            <div className="actionable select-button"  onClick={() => this.props.show('resetHistory')} >
                <span className="glyphicon glyphicon-refresh"></span>
                <span className="transaction-button-text">Reset Company History</span>

            </div>
            <div className="actionable select-button" onClick={() => this.props.show('deleteCompany')} >
                <span className="glyphicon glyphicon-trash"></span>
                <span className="transaction-button-text">Delete Company</span>
            </div>

        </SelectionBase>
    }
}


