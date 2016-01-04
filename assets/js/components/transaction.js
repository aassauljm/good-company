"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import {reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { numberWithCommas } from '../utils';
import { pushState } from 'redux-router';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';


function renderParcelString(amount, shareClass) {
    const _shareClass = shareClass || STRINGS.defaultShareClass;
    const _amount = numberWithCommas(amount);
    return `${_amount} ${_shareClass} shares` ;
}

function renderHolders(holders){
    return holders.map((holder, i) =>
            <dd key={i} >{holder.name} <br/>
            <span className="address">{holder.address}</span></dd>)
}

function renderSeed(data, effectiveDate) {

}


function renderAddressChange(data, effectiveDate) {
    return (
        <div className="panel panel-default">
            <div className="panel-heading">
                <h3 className="panel-title">Address Change</h3>
            </div>
            <div className="panel-body">
            <dl>
            <dt>Address Type:</dt>
            <dd>{ STRINGS[data.field] }</dd>

            <dt>From:</dt>
            <dd>{ data.previousAddress }</dd>

            <dt>To:</dt>
            <dd>{ data.newAddress }</dd>

            <dt>Effective Date:</dt>
            <dd>{ new Date(effectiveDate).toDateString() }</dd>
            </dl>
            </div>
        </div>)
}


function renderIssueTo(data, effectiveDate) {
    return (
        <div className="panel panel-default">
            <div className="panel-heading">
                <h3 className="panel-title">Issue To</h3>
            </div>
            <div className="panel-body">
            <dl>
            <dt>Amount:</dt>
            <dd>{ renderParcelString(data.amount, data.shareClass) }</dd>

            <dt>To:</dt>
            { renderHolders(data.holders) }

            <dt>Effective Date:</dt>
            <dd>{ new Date(effectiveDate).toDateString() }</dd>
            </dl>
            </div>
        </div>)
}


// TODO
function renderIssue(data, effectiveDate) {
    return (
        <div className="panel panel-default">
            <div className="panel-heading">
                <h3 className="panel-title">Issue To</h3>
            </div>
            <div className="panel-body">
            <dl>
            <dt>Amount:</dt>
            <dd>{ renderParcelString(data.amount, data.shareClass) }</dd>

            <dt>To:</dt>
            { renderHolders(data.holders) }

            <dt>Effective Date:</dt>
            <dd>{ new Date(effectiveDate).toDateString() }</dd>
            </dl>
            </div>
        </div>)
}

export class TransactionViewModal extends React.Component {

    static propTypes = {
        modalData: PropTypes.object.isRequired,
    };

    componentWillUnmount() {
        this.refs.modal._onHide();
    }

    renderBody(transaction) {
        switch(transaction.type){
            case 'SEED':
                return renderSeed(transaction.data, transaction.effectiveDate);
            case 'ISSUE':
                return renderIssue(transaction.data, transaction.effectiveDate);
            case 'COMPOUND':
                return (transaction.subTransactions || []).map((t, i) => <div key={i}>{ this.renderBody(t) }</div>);
            case 'ADDRESS_CHANGE':
                return renderAddressChange(transaction.data, transaction.effectiveDate)
            case 'ISSUE_TO':
                return renderIssueTo(transaction.data, transaction.effectiveDate)
            default:
                return 'Unknown'
        }
    }

    render() {
        console.log(this.props)
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>{ STRINGS.transactionTypes[this.props.modalData.type] }</Modal.Title>
              </Modal.Header>

              <Modal.Body>
                { this.renderBody(this.props.modalData) }
              </Modal.Body>

              <Modal.Footer>
                <Button onClick={this.props.end} >Close</Button>
              </Modal.Footer>
            </Modal>
    }

}