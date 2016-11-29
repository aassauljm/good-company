"use strict";
import React, {PropTypes} from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { Link } from 'react-router';
import { companyTransaction, addNotification } from '../../actions';
import { UpdatePersonConnected, updatePersonSubmit, updateHistoricPersonSubmit } from '../forms/person';
import LawBrowserLink from '../lawBrowserLink';
import { change } from 'redux-form';

export function ShareholderLawLinks(){
    return <div>
            <LawBrowserLink title="Companies Act 1993" location="s 214(1)" >Shareholder's address prescribed for annual return</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 87(2)(a)" >Share Register to contain last known addresses</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 2(5)" >Meaning of address</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 391" >Service of documents on shareholders</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 392" >Additional provisions relating to service</LawBrowserLink>
        </div>
}


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
        const person = this.props.transactionViewData.person;
        if(!person.companyNumber){
            person.attr = person.attr || {};
            person.attr.isNaturalPerson = person.attr.isNaturalPerson || true;
        }
        return <UpdatePersonConnected
                    ref="form"
                    initialValues={{effectiveDate: new Date(), ...person}}
                    onSubmit={this.submit}/>

    }

    submit(values) {
        if(this.props.transactionViewData.afterClose){
            this.props.dispatch(change(this.props.transactionViewData.formName, this.props.transactionViewData.field, values));
            this.props.end();
            return;
        }
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
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'} lawLinks={ShareholderLawLinks()}>
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
    return <UpdatePersonTransactionViewBase {...props} submitFormat={updatePersonSubmit} title="Update Person"/>
}

export function UpdateHistoricPersonTransactionView(props) {
    return <UpdatePersonTransactionViewBase {...props} submitFormat={updateHistoricPersonSubmit} title="Update Historic Shareholder"/>
}


