"use strict";
import React from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { personList } from '../../utils';
import { deleteResource, addNotification } from '../../actions';
import { push } from 'react-router-redux';

@connect((state, ownProps) => {
    return {};
}, (dispatch, ownProps) => {
    return {
        resetAction: (args) => {
            return dispatch(deleteResource(`/company/${ownProps.transactionViewData.companyId}`, {}, {}))
            .then(() => {
                ownProps.end();
                dispatch(push('/'))
                dispatch(addNotification({message: 'Company Deleted.'}));
            })
        }
    }
})
export class DeleteCompanyTransactionView extends React.Component {
    constructor(props) {
        super(props);
        this.handleDelete = ::this.handleDelete;
        this.handleClose = ::this.handleClose;
    }

    handleClose() {
        this.props.end();
    }

    handleDelete() {
        this.props.resetAction();
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Delete Company</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
              <p>Selected 'Delete Company' will remove this company from your account. </p>
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
                <Button onClick={this.handleDelete} bsStyle="danger">Delete Company</Button>
              </TransactionView.Footer>
            </TransactionView>
    }

}