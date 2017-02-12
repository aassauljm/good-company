"use strict";
import React from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { personList } from '../../utils';
import STRINGS from '../../strings';
import { updateResource, addNotification, resetTransactionViews } from '../../actions';



@connect((state, ownProps) => {
    return {};
}, (dispatch, ownProps) => {
    return {
        resetAction: (args) => {
            return dispatch(updateResource(`/company/${ownProps.transactionViewData.companyId}/reset_pending_history`, {}, {loadingMessage: 'Undoing Company Reconciliation'}))
            .then(() => {
                ownProps.end();
                dispatch(resetTransactionViews())
                dispatch(addNotification({message: 'Company Reconciliation Reset'}));
            })
        }
    }
})
export class ResetHistoryTransactionView extends React.Component {
    constructor(props) {
        super(props);
        this.handleReset = ::this.handleReset;
        this.handleClose = ::this.handleClose;
    }

    handleClose() {
        this.props.end();
    }

    handleReset() {
        this.props.resetAction();
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>{ STRINGS.resetCompanyHistory } </TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
              <p>Selecting 'Reset Company History' below will undo any historic transactions imported from the companies office.</p>
              <p>You will be able to import again afterwards.</p>
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
                <Button onClick={this.handleReset} bsStyle="danger">Reset Company Reconciliation</Button>
              </TransactionView.Footer>
            </TransactionView>
    }

}