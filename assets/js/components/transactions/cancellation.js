"use strict";
import React, {PropTypes} from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from '../forms/input';
import STRINGS from '../../strings'
import { numberWithCommas } from '../../utils'
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { fieldStyle, fieldHelp } from '../../utils';
import { Link } from 'react-router';
import { companyTransaction, addNotification } from '../../actions';




@connect(undefined)
export class CancellationTransactionView extends React.Component {
    constructor(props) {
        super(props);
        // this.submit = ::this.submit;
    }

    handleNext() {
       // this.refs.form.submit();
       //this.submit();

    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Cancel Shares</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
               THIS FUNCTIONALITY IS UNDER DEVELOPMENT
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={this.props.end} >Cancel</Button>
                 {/* <Button onClick={::this.handleNext} bsStyle="primary">{ 'Submit' }</Button> */ }
              </TransactionView.Footer>
            </TransactionView>
    }
}