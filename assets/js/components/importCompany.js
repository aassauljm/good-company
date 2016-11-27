"use strict";
import React, {PropTypes} from 'react';
import TransactionView from './forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { importCompany, addNotification, requestResource } from '../actions';
import { reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { fieldStyle, fieldHelp, requiredFields, formFieldProps } from '../utils';
import { push } from 'react-router-redux'
import LookupCompany from './lookupCompany';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';




export class ImportCompany extends React.Component {
    static propTypes = {
    };

    renderSummary() {
        const {location: {query: {companyName, companyNumber, struckOff, notes}}} = this.props;
        return <div className="well">
            <dl className="dl-horizontal">
                <dt >Company Name</dt>
                <dd >{companyName}</dd>
                <dt >Company Number</dt>
                <dd >{companyNumber}</dd>
                <dt >Status</dt>
                <dd >{struckOff === "true" ? 'Struck Off': 'Registered'}</dd>
                <dt >Notes</dt>
                <dd >{ ([notes] || []).map((note, i) => {
                        return <span key={i}>{note}</span>
                    }) }</dd>
                </dl>
                <div className="text-center">
                    <Button bsStyle="primary" onClick={::this.importCompany} >Import this Company</Button>
                </div>
        </div>
    }

    renderLoading() {
        return <div>
        <div className="text-center">Importing Company - {this.props.location.query.companyName}.</div>
        <div className="text-center">This may take a few moments...</div>
            <div className="loading"> <Glyphicon glyph="refresh" className="spin"/></div>
            </div>
    }

    importCompany(){
        this.props.dispatch(importCompany(this.props.params.companyNumber))
            .then((result = {response: {message: 'No connection'}}) => {
                this.props.dispatch(addNotification({message: 'Company Imported'}));
                this.props.dispatch(requestResource('companies', {refresh: true}));
                this.props.dispatch(push('/company/view/'+result.response.id))
            })
            .catch(error => {
                this.props.dispatch(addNotification({message: `Could not import company, Reason: ${error.message}`, error: true}));
            })
    };


    render() {
        const valid = false;
        return <div className="container">
                <div className="row">
                <div className="widget">
                    <div className="widget-header">
                        <div className="widget-title">
                            Import from the New Zealand Companies Office
                        </div>
                    </div>
                    <div className="widget-body">
                        { this.props.importCompany._status === 'fetching' ? this.renderLoading() : this.renderSummary() }
                    </div>
                </div>
                </div>
            </div>
    }
}

const ImportCompanyConnected = connect(state => ({importCompany: state.importCompany}))(ImportCompany);
export default ImportCompanyConnected;