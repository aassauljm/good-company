"use strict";
import React, {PropTypes} from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from '../forms/buttonInput';
import { connect } from 'react-redux';
import { reduxForm, destroy } from 'redux-form';
import Input from '../forms/input';
import { formFieldProps, requireFields, joinAnd, personList } from '../../utils';
import { Link } from 'react-router';
import { companyTransaction, addNotification, showTransactionView } from '../../actions';
import STRINGS from '../../strings';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { DirectorConnected, NewDirectorConnected, directorSubmit } from '../forms/person';
import { Director } from '../company';
import { personOptionsFromState } from '../../utils';
import { DirectorLawLinks } from './selectDirector'


@connect(undefined)
export class UpdateDirectorTransactionView extends React.Component {
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
        this.props.dispatch(destroy('director'));
        this.props.end(data);
    }

    renderBody() {
        return this.props.transactionViewData.director ? this.updateDirector() : this.newDirector()
    }

    updateDirector() {
        return <DirectorConnected
            ref="form"
            initialValues={{...this.props.transactionViewData.director,
                appointment: new Date(this.props.transactionViewData.director.appointment) }}
            onSubmit={this.submit}/>
    }

    newDirector() {
        const personOptions = personOptionsFromState(this.props.transactionViewData.companyState, (p => !p.companyNumber));
        return <NewDirectorConnected
            ref="form"
            initialValues={{...this.props.transactionViewData.director,
                approvedBy: 'Ordinary Resolution',
                appointment: new Date() }}
                personOptions={personOptions}
                newPerson={() => this.props.dispatch(showTransactionView('newPerson', {
                    ...this.props.transactionViewData,
                    formName: 'director',
                    field: 'newPerson',
                    afterClose: { // open this transactionView again
                        showTransactionView: {key: 'updateDirector', data: {...this.props.transactionViewData, index: this.props.index}}
                    }
                }))}

            onSubmit={this.submit}/>
    }

    isNew() {
        return !!this.props.transactionViewData.director;
    }

    submit(values) {
        const transactions = directorSubmit(values, this.props.transactionViewData.director, this.props.transactionViewData.companyState)
        if(transactions.length){
            this.props.dispatch(companyTransaction(
                                    'compound',
                                    this.props.transactionViewData.companyId,
                                    {transactions: transactions, documents: values.documents} ))
                .then(() => {
                    this.handleClose({reload: true});
                    this.props.dispatch(addNotification({message: this.isNew() ? 'Director Appointed' : 'Directorship Updated.'}));
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
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'} lawLinks={DirectorLawLinks()}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Manage Directors</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody() }
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
                { !this.isNew() && <Button onClick={this.handleNext} bsStyle="primary">Update</Button> }
                { this.isNew() && <Button onClick={this.handleNext} bsStyle="primary">Create</Button> }
              </TransactionView.Footer>
            </TransactionView>
    }

}