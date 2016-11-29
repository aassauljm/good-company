"use strict";
import React, {PropTypes} from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from '../forms/buttonInput';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from '../forms/input';
import { Link } from 'react-router';
import { companyTransaction, addNotification, showTransactionView } from '../../actions';
import STRINGS from '../../strings';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { contactLawLinks } from '../contactDetails';


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
        this.props.showTransactionView(key, {companyState: this.props.companyState, companyId: this.props.companyId, afterClose: {location: this.props.location.pathname}});
    }

    submit(values) {

    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'} lawLinks={this.props.lawLinks}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>{ this.props.title }</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody() }
              </TransactionView.Body>
              { this.props.end && <TransactionView.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
              </TransactionView.Footer> }
            </TransactionView>
    }

}

export class AddAssignSharesTransactionView extends React.Component {

    render() {
        return <SelectionBase {...this.props} title="Add and Assign Shares">
            <div className="actionable select-button"  onClick={() => {
                    this.props.navigate({pathname: `/company/view/${this.props.transactionViewData.companyId}/share_classes`, state: {skipDirtyLeave: true}});
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




export class ConsolidateDivideTransactionView extends React.Component {

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

export class RepurchaseRedeemTransactionView extends React.Component {

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

export class UpdateHoldingHolderTransactionView extends React.Component {

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


export class ResetDeleteTransactionView extends React.Component {

    render() {
        return <SelectionBase {...this.props} title="Update Shareholdings and Shareholders">
            <div className="actionable select-button"  onClick={() => this.props.show('resetHistory')} >
                <span className="glyphicon glyphicon-refresh"></span>
                <span className="transaction-button-text">Undo Import Company History</span>

            </div>
            <div className="actionable select-button" onClick={() => this.props.show('deleteCompany')} >
                <span className="glyphicon glyphicon-trash"></span>
                <span className="transaction-button-text">Delete Company</span>
            </div>

        </SelectionBase>
    }
}


export class UpdateAddressesTransactionView extends React.Component {

    render() {
        return <SelectionBase {...this.props} title="Change Addresses" lawLinks={contactLawLinks()}>
            <div className="actionable select-button"  onClick={() => this.props.show('changeRegisteredOffice')} >
                <span className="glyphicon glyphicon-home"></span>
                <span className="transaction-button-text">Change Registered Office</span>

            </div>
            <div className="actionable select-button" onClick={() => this.props.show('changeAddressForService')} >
                <span className="glyphicon glyphicon-home"></span>
                <span className="transaction-button-text">Change Address for Service</span>
            </div>
        </SelectionBase>
    }
}



export class UpdatePeople extends React.Component {

    render() {
        return <SelectionBase {...this.props} title="Update People" >
            <div>
            <div className="text-center"><h5>Shareholdings & Shareholders</h5></div>
            <div className="actionable select-button" onClick={() => this.props.show('selectPerson')} >
                <span className="glyphicon glyphicon-user"></span>
                <span className="transaction-button-text">Shareholders</span>
            </div>
            <div className="actionable select-button" onClick={() => this.props.show('selectHistoricPerson')} >
                <span className="glyphicon glyphicon-hourglass"></span>
                <span className="transaction-button-text">Historic Shareholder</span>
            </div>

            <div className="actionable select-button"  onClick={() => this.props.show('selectHolding')} >
                <span className="glyphicon glyphicon-briefcase"></span>
                <span className="transaction-button-text">Update Shareholding</span>
            </div>
            </div>

            <div className="row">
            <div className="col-xs-12">
            <div className="text-center"><h5>Directors</h5></div>
            <div className="actionable select-button" onClick={() => this.props.show('newDirector')  } >
                    <span className="glyphicon glyphicon-user"></span>
                    <span className="transaction-button-text">Appoint Director</span>
            </div>
            <div className="actionable select-button" onClick={() => this.props.show('selectDirectorUpdate')  } >
                    <span className="glyphicon glyphicon-user"></span>
                    <span className="transaction-button-text">Update Director</span>
            </div>

            <div className="actionable select-button" onClick={() => this.props.show('selectDirectorRemove')  } >
                    <span className="glyphicon glyphicon-user"></span>
                    <span className="transaction-button-text">Remove Director</span>
            </div>

            </div>
            </div>
        </SelectionBase>
    }
}



export class UpdateContact extends React.Component {

    render() {
        return <SelectionBase {...this.props} title="Update Contact" lawLinks={contactLawLinks()}>
            <div className="actionable select-button"  onClick={() => this.props.show('changeRegisteredOffice')} >
                <span className="glyphicon glyphicon-home"></span>
                <span className="transaction-button-text">Registered Office</span>

            </div>
            <div className="actionable select-button" onClick={() => this.props.show('changeAddressForService')} >
                <span className="glyphicon glyphicon-home"></span>
                <span className="transaction-button-text">Address for Service</span>
            </div>
            <div className="actionable select-button" onClick={() => this.props.show('contactDetails')} >
                <span className="glyphicon glyphicon-envelope"></span>
                <span className="transaction-button-text">Other Contact Details</span>
            </div>

        </SelectionBase>
    }
}



export class UpdateShares extends React.Component {

    render() {
        return <SelectionBase {...this.props} title="Update Shares" >

            <div className="actionable select-button"  onClick={() => this.props.show('manageShareClasses')} >
                <span className="glyphicon glyphicon-envelope"></span>
                <span className="transaction-button-text">Manage Share Classes</span>
            </div>

            <div className="actionable select-button" onClick={() => this.props.show('applyShareClasses')} >
                    <span className="glyphicon glyphicon-list-alt"></span>
                    <span className="transaction-button-text">Apply Share Classes</span>
            </div>

            <div className="actionable select-button" onClick={() => this.props.show('transfer') } >
                <span className="glyphicon glyphicon-transfer"></span>
                <span className="transaction-button-text">Transfer Shares</span>
            </div>

            <div className="actionable select-button" onClick={() => this.props.show('issue') } >
                    <span className="glyphicon glyphicon-share"></span>
                    <span className="transaction-button-text">Issue New Shares</span>
            </div>
            <div className="actionable select-button"  onClick={() => this.props.show('consolidation')} >
                <span className="glyphicon glyphicon-envelope"></span>
                <span className="transaction-button-text">Consolidate Shares</span>
            </div>
            <div className="actionable select-button" onClick={() => this.props.show('subdivision')} >
                <span className="glyphicon glyphicon-resize-full"></span>
                <span className="transaction-button-text">Subdivide Shares</span>
            </div>
            <div className="actionable select-button"  onClick={() => this.props.show('purchase')} >
                <span className="glyphicon glyphicon-usd"></span>
                <span className="transaction-button-text">Repurchase Shares</span>

            </div>
            <div className="actionable select-button" onClick={() => this.props.show('redemption')} >
                <span className="glyphicon glyphicon-import"></span>
                <span className="transaction-button-text">Redeem Shares</span>
            </div>
            <div className="actionable select-button" onClick={() => this.props.show('cancellation')} >
                <span className="glyphicon glyphicon-import"></span>
                <span className="transaction-button-text">Cancel Shares</span>
            </div>


        </SelectionBase>
    }
}


export const UpdateResetDelete = ResetDeleteTransactionView;
