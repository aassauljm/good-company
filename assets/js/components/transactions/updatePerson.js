"use strict";
import React, {PropTypes} from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { Link } from 'react-router';
import { companyTransaction, addNotification } from '../../actions';
import { UpdatePersonConnected, updatePersonSubmit, updateHistoricPersonSubmit } from '../forms/person';


@connect(undefined)
class UpdatePersonTransactionViewBase extends React.Component {
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
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <UpdatePersonConnected
                    ref="form"
                    initialValues={{effectiveDate: new Date(), ...this.props.transactionViewData.person}}
                    onSubmit={this.submit}/>
                </div>
            </div>
    }

    submit(values) {
        const transactions = this.props.submitFormat(values, this.props.transactionViewData.person)
        if(transactions.length){
            this.props.dispatch(companyTransaction(
                                    'compound',
                                    this.props.transactionViewData.companyId,
                                    {transactions: transactions} ))
                .then(() => {
                    this.handleClose({reload: true});
                    this.props.dispatch(addNotification({message: 'Person Updated'}));
                    const key = this.props.transactionViewData.companyId;
                })
                .catch((err) => {
                    this.props.dispatch(addNotification({message: err.message, error: true}));
                })
        }
        else{
            this.handleClose();
        }
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>{this.props.title}</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody(this) }
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
                <Button onClick={this.handleNext} bsStyle="primary">Update</Button>
              </TransactionView.Footer>
            </TransactionView>
    }


}

export function UpdatePersonTransactionView(props) {
    return <UpdatePersonTransactionViewBase {...props} submitFormat={updatePersonSubmit} title="Update Shareholder"/>
}

export function UpdateHistoricPersonTransactionView(props) {
    return <UpdatePersonTransactionViewBase {...props} submitFormat={updateHistoricPersonSubmit} title="Update Historic Shareholder"/>
}

