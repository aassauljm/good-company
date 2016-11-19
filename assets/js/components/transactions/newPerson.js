"use strict";
import React, {PropTypes} from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from '../forms/buttonInput';
import { connect } from 'react-redux';
import { change } from 'redux-form';
import { NewPersonConnected } from '../forms/person';



@connect(undefined)
export class NewPersonTransactionView extends React.Component {
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
        this.props.end();
    }

    renderBody(companyState) {
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <NewPersonConnected
                    ref="form"
                    onSubmit={this.submit}/>
                </div>
            </div>

    }

    render() {
        // TODO, connect this to the form data, check valid and submitting, disable submit button
        return  <TransactionView ref="transactionView" show={true} bsSize="large" animation={!this.props.transactionViewData.afterClose} onHide={this.props.end} backdrop={'static'}>
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


