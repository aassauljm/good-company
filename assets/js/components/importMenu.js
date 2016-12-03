"use strict";
import React, {PropTypes} from 'react';
import TransactionView from './forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { importCompany, addNotification, requestResource, createResource, importBulk } from '../actions';
import { reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { fieldStyle, fieldHelp, requireFields, formFieldProps } from '../utils';
import { push } from 'react-router-redux'
import LookupCompany from './lookupCompany';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { ConnectedPlaceholderSearch } from './search';
import { Link } from 'react-router';

const fields = [
    'listType',
    'identifierList'
];

const validate = requireFields('identifierList')

@formFieldProps()
export class BulkImport extends React.Component {
    render() {
        return <form className="form"onSubmit={this.props.handleSubmit} >
            <Input type="select" {...this.formFieldProps('listType', STRINGS.bulkImport)}>
                <option value="nzbn">{STRINGS.bulkImport.nzbn}</option>
                <option value="companyName">{STRINGS.bulkImport.companyName}</option>
                <option value="companyNumber">{STRINGS.bulkImport.companyNumber}</option>
            </Input>
            <Input type="textarea" rows="10" {...this.formFieldProps('identifierList', STRINGS.bulkImport)} label={'List of '+STRINGS.bulkImport[this.props.fields.listType.value]+'s'} />
            <div className="button-row">
                <Button bsStyle="primary" type="submit" onClick={this.props.import}>Import</Button>
            </div>
        </form>
    }
}


const BulkImportConnected = reduxForm({
  form: 'bulkImport',
  fields,
  validate,
  initialValues: {listType: 'nzbn'}
})(BulkImport);




/*


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
*/



@connect(state => ({importCompanyData: state.importCompany}), {
    importCompany: (...args) => importCompany(...args),
    addNotification: (...args) => addNotification(...args),
    requestResource: (...args) => requestResource(...args),
})
export class ImportSingle extends React.Component {

    constructor(props) {
        super();
        this.handleSelect = ::this.handleSelect;
        this.importCompany = ::this.importCompany;
        this.state = {};
    }


    handleSelect(item) {
        this.setState({company: item});
    }

    renderSummary(company) {
        const {companyName, companyNumber, struckOff, notes} = company;
        return <div>
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
                <div className="button-row">
                    <Button  onClick={() => this.setState({'company': null, finished: null})} >Cancel</Button>
                    <Button bsStyle="primary" onClick={this.importCompany} >Import this Company</Button>
                </div>
        </div>
    }

    importCompany() {
        this.props.importCompany(this.state.company.companyNumber)
            .then((result = {response: {message: 'No connection'}}) => {
                this.props.addNotification({message: 'Company Imported'});
                this.props.requestResource('companies', {refresh: true});
                this.setState({finished: result.response.id});
            })
            .catch(error => {
                this.props.addNotification({message: `Could not import company, Reason: ${error.message}`, error: true});
            })
    }

    renderLoading() {
        return <div>
        <div className="text-center">Importing Company - {this.state.company.companyName}.</div>
        <div className="text-center">This may take a few moments...</div>
            <div className="loading"> <Glyphicon glyph="refresh" className="spin"/></div>
            </div>
    }

    render() {
        if(this.props.importCompanyData._status === 'fetching'){
            return this.renderLoading();
        }
        if(this.state.finished){
            return this.renderResult();
        }
        if(this.state.company){
            return this.renderSummary(this.state.company);
        }
        return  <ConnectedPlaceholderSearch placeholder='Type to find a company' onlyCompaniesOffice={true} onSelect={this.handleSelect}/>
    }

    renderResult() {
        return <div>
        <p><strong>{this.state.company.companyName}</strong> has been imported.</p>
                <div className="button-row">
                    <Button  onClick={() => this.setState({'company': null, finished: null})} >Import Another Company</Button>
                    <Link to={`/company/view/${this.state.finished}`} className="btn btn-primary">View Company</Link>
                </div>
        </div>
    }

}

export const ImportSingleFull = () => {
    return <div className="container">
        <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                   Import from the Companies Register
                </div>
            </div>
            <div className="widget-body">
                 <div className="row">
                 <div className="col-md-6 col-md-offset-3">
                        <ImportSingle />
                    </div>
                </div>
            </div>
        </div>
    </div>
}

export const ImportSingleWidget = () => {
    return  <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                   Import from the Companies Register
                </div>
            </div>
            <div className="widget-body">
                <ImportSingle />
                <div className="button-row">
                <Link className="btn btn-info" to="/import">Bulk Import</Link>
                </div>
            </div>
        </div>
}

@connect(state => state.importBulk, {
    importBulk: (data) => importBulk(data),
    addNotification: (data) => addNotification(data),
    navigateHome: () => push('/')
})
export class ImportBulk extends React.Component {

    handleSubmit(values) {
        const list = values.identifierList.split('\n').filter(v => v);
        this.props.importBulk({
            listType: values.listType,
            list: list
        })
            .then((result = {response: {message: 'No connection'}}) => {
                this.props.addNotification({message: `${list.length} Compan${list.length > 1 ? 'ies': 'y'} queued for import`});
                this.props.navigateHome();
            })
            .catch(error => {
                this.props.addNotification({message: `Could not import companies, Reason: ${error.message}`, error: true});
            })
    }

    render() {
        const valid = false;
        return <div className="container">
                <div className="widget">
                    <div className="widget-header">
                        <div className="widget-title">
                            Bulk Import from the New Zealand Companies Office
                        </div>
                    </div>
                    <div className="widget-body">
                    <p>Copy and paste your company identifiers into the field below, with each identifier on a new line.</p>
                    <p>Your companies will be imported in the background, and you will get an email when it is finished.</p>
                       <div className="row">
                         <div className="col-md-6 col-md-offset-3">
                            <BulkImportConnected onSubmit={::this.handleSubmit}/>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
    }

}



export default class ImportPage extends React.Component {
    render() {
        return <div>
            <ImportSingleFull />
            <ImportBulk />
        </div>
    }
}
