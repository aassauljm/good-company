"use strict";
import React, {PropTypes} from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from '../forms/buttonInput';
import { connect } from 'react-redux';
import { change } from 'redux-form';
import { NewPersonConnected, DirectorPersonConnected } from '../forms/person';
import { DirectorLawLinks } from './selectDirector'


@connect(undefined)
class NewPerson extends React.Component {
    constructor(props) {
        super(props);
        this.submit = ::this.submit;
    }

    handleNext() {
        this.refs.form.submit();
    }

    submit(values) {
        if(this.props.transactionViewData.afterClose){
            this.props.dispatch(change(this.props.transactionViewData.formName, this.props.transactionViewData.field, values));
            this.props.end();
            return;
        }
        else{
            this.props.end();
        }
    }

    renderBody(companyState) {
        return <this.props.form
                    ref="form"
                    initialValues={{attr: {contactMethod: 'address'}}}
                    onSubmit={this.submit}/>

    }

    render() {
        // TODO, connect this to the form data, check valid and submitting, disable submit button
        // figture out lawlinks
        return  <TransactionView ref="transactionView" show={true} bsSize="large" animation={!this.props.transactionViewData.afterClose} onHide={this.props.end} backdrop={'static'} lawLinks={this.props.lawLinks}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Create New Person</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody(this.props.transactionViewData.companyState) }
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={this.props.end} >Cancel</Button>
                 <Button onClick={::this.handleNext} bsStyle="primary">Create</Button>
              </TransactionView.Footer>
            </TransactionView>
    }
}


export function NewPersonTransactionView(props) {
    return <NewPerson {...props} form={NewPersonConnected} />
}

export function NewDirectorPersonTransactionView(props) {
    return <NewPerson {...props} form={DirectorPersonConnected} lawLinks={DirectorLawLinks()}/>
}
