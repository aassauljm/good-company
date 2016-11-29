"use strict";
import React, {PropTypes} from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from '../forms/buttonInput';
import { connect } from 'react-redux';
import { reduxForm, destroy } from 'redux-form';
import Input from '../forms/input';
import { formFieldProps, requireFields, joinAnd, personList, personMap } from '../../utils';
import { Link } from 'react-router';
import { companyTransaction, addNotification, showTransactionView } from '../../actions';
import STRINGS from '../../strings';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { UpdateDirectorConnected, NewDirectorConnected, RemoveDirectorConnected, directorSubmit } from '../forms/person';
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
        return <UpdateDirectorConnected
            ref="form"
            initialValues={{...this.props.transactionViewData.director,
                appointment: new Date(this.props.transactionViewData.director.appointment)
            }}
            updatePerson={() => this.props.dispatch(showTransactionView('updatePerson', {
                ...this.props.transactionViewData,
                formName: 'director',
                field: 'person',
                afterClose: { // open this transactionView again
                    showTransactionView: {key: 'updateDirector', data: {...this.props.transactionViewData, index: this.props.index}}
                }
            }))}

            onSubmit={this.submit}/>
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
                <TransactionView.Title>Update Director</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody() }
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
                 <Button onClick={this.handleNext} bsStyle="primary">Update Director</Button>
              </TransactionView.Footer>
            </TransactionView>
    }

}

@connect(undefined)
export class NewDirectorTransactionView extends React.Component {
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
        const personOptions = personOptionsFromState(this.props.transactionViewData.companyState, (p => !p.companyNumber));
        const pMap = personMap(this.props.transactionViewData.companyState);
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
                    showTransactionView: {key: 'newDirector', data: {...this.props.transactionViewData, index: this.props.index}}
                }
            }))}
            updatePerson={(person) => this.props.dispatch(showTransactionView('updatePerson', {
                ...this.props.transactionViewData,
                person,
                formName: 'director',
                field: 'person',
                afterClose: { // open this transactionView again
                    showTransactionView: {key: 'newDirector', data: {...this.props.transactionViewData, index: this.props.index}}
                }
            }))}
            personMap={pMap}
            onSubmit={this.submit}/>
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
                    this.props.dispatch(addNotification({message: 'Director Appointed'}));
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
               <Button onClick={this.handleNext} bsStyle="primary">Create</Button>
              </TransactionView.Footer>
            </TransactionView>
    }
}

@connect(undefined)
export class RemoveDirectorTransactionView extends React.Component {
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
        return this.updateDirector()
    }

    updateDirector() {
        return <RemoveDirectorConnected
            ref="form"
            initialValues={{...this.props.transactionViewData.director,
                appointment: new Date(this.props.transactionViewData.director.appointment) }}
            onSubmit={this.submit}/>
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
                    this.props.dispatch(addNotification({message: 'Director Removed'}));
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
                <TransactionView.Title>Remove Director</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody() }
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
                 <Button onClick={this.handleNext} bsStyle="primary">Update Director</Button>
              </TransactionView.Footer>
            </TransactionView>
    }

}