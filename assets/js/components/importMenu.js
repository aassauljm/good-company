"use strict";
import React, {PropTypes} from 'react';
import TransactionView from './forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { importCompany, addNotification, requestResource, createResource, importBulk, deleteResource, requestUserInfo } from '../actions';
import { reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { fieldStyle, fieldHelp, requireFields, formFieldProps } from '../utils';
import { push } from 'react-router-redux'
import LookupCompany from './lookupCompany';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { ConnectedPlaceholderSearch } from './search';
import { Link } from 'react-router';
import Widget from './widget';
import LawBrowserContainer from './lawBrowserContainer';


export const REALME_LOGO = 'https://www.companiesoffice.govt.nz/companies/rm_logo.png';


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
                    <Button  onClick={() => this.setState({'company': null, finished: null, error: null})} >Cancel</Button>
                    <Button bsStyle="primary" className="import-company" onClick={this.importCompany} >Import this Company</Button>
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
                this.setState({error: error.message});
                //this.props.addNotification({message: `Could not import company, Reason: ${error.message}`, error: true});
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
        if(this.state.error){
            return this.renderError();
        }
        if(this.state.company){
            return this.renderSummary(this.state.company);
        }
        return  <ConnectedPlaceholderSearch  form={this.props.form} placeholder='Type to find a company...'
            onlyCompaniesOffice={true} onSelect={this.handleSelect} initialValues={{input: this.props.initialValue}}/>
    }

    renderError() {
        return <div>
        <p><strong>{this.state.company.companyName}</strong> could not be imported.</p>
        <div className="alert alert-danger">{ this.state.error }</div>
                <div className="button-row">
                    <Button  onClick={() => this.setState({'company': null, finished: null, error: null})} >Import Another Company</Button>
                </div>
        </div>
    }

    renderResult() {
        return <div>
        <p><strong>{this.state.company.companyName}</strong> has been imported.</p>
                <div className="button-row">
                    <Button  onClick={() => this.setState({'company': null, finished: null, error: null})} >Import Another Company</Button>
                    <Link to={`/company/view/${this.state.finished}`}  className="btn btn-primary view-company ">View Company</Link>
                </div>
        </div>
    }

}

export const ImportSingleFull = (props) => {
    return <LawBrowserContainer>
        <Widget  className="import-full-widget" title="Search the Companies Register">
                 <div className="row">
                 <div className="col-md-6 col-md-offset-3">
                        <ImportSingle initialValue={props.initialValue} form='searchFormBig'/>
                    </div>
                </div>
            </Widget>
        </LawBrowserContainer>

}

export const realMeActions = (dispatch) => ({
    disconnectNzbn: () => {
        dispatch(deleteResource('/auth-with/nzbn', {
                confirmation: {
                    title: 'Confirm Disconnection of RealMe®',
                    description: 'Please confirm the disconnecting of RealMe® from your Good Companies account.',
                    resolveMessage: 'Confirm Disconnection',
                    resolveBsStyle: 'warning'
                }
            }))
            .then(result => dispatch(requestUserInfo({ refresh: true })))
            .then(result => dispatch(addNotification({ message: 'Your RealMe® account has been disconnected from your Good Companies account' })))
    }
});

@connect(state => ({userInfo: state.userInfo}), realMeActions)
export class RealMeConnect extends React.PureComponent {

    renderConnect() {
        return  (
            <div>
                <p>Retrieve a list of companies you have authority over using your RealMe® account.</p>
                <div className="button-row">
                    <a href="/api/auth-with/nzbn"><img alt="Lookup Companies with RealMe" src={REALME_LOGO}/></a>
                </div>
            </div>
        );
    }

    renderLink() {
        return (
            <div>
                <p>Your RealMe® account is connected with this Good Companies account.</p>

                <div className="button-row">
                    <Link to={'/import/nzbn'} className="btn btn-primary">Click here to select your Companies</Link>
                    <Button bsStyle="warning" type="submit" onClick={this.props.disconnectNzbn}>Disconnect from RealMe®</Button>
                </div>
            </div>
        );
    }

    render() {
        const hasNZBN = this.props.userInfo.mbieServices.indexOf('nzbn') >= 0;
        return <LawBrowserContainer>
                <Widget title="Import with RealMe®">
                    <div className="row">
                         <div className="col-md-6 col-md-offset-3">
                         { hasNZBN && this.renderLink() }
                         { !hasNZBN && this.renderConnect() }
                         </div>
                        </div>
                </Widget>
            </LawBrowserContainer>
        }
}

@connect(state => ({userInfo: state.userInfo}))
export class ImportSingleWidget extends React.PureComponent {

    renderBody() {
        const hasNZBN = this.props.userInfo.mbieServices.indexOf('nzbn') >= 0;
        return <div>
            <ImportSingle form='searchForm'/>
            <div className="button-row">
                <Link className="btn btn-info bulk-import" to="/import">Bulk Import</Link>
                { !hasNZBN && <a href="/api/auth-with/nzbn"><img alt="Lookup Companies with RealMe" src={REALME_LOGO}/></a> }
                { hasNZBN && <Link to={'/import/nzbn'}><img alt="Lookup Companies with RealMe" src={REALME_LOGO}/></Link> }
                </div>
        </div>
    }

    renderUpgradeWarning() {
        return <div>
        <p>Please upgrade your CataLex account to import and manage your own companies.</p>
                <div className="button-row">
                <a className="btn btn-primary" href={this.props.upgradeUrl}>Click Here to Upgrade</a>
                </div>
        </div>
    }

    render() {
        return  <Widget className="import-widget" title="Import from the Companies Register" iconClass="fa fa-download">
                    { this.props.canImport && this.renderBody() }
                    { !this.props.canImport && this.renderUpgradeWarning() }
                </Widget>
        }
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
        return <LawBrowserContainer>
            <Widget title="Bulk Import from the New Zealand Companies Register">
                <p>Copy and paste your company identifiers into the field below, with each identifier on a new line.</p>
                    <p>Your companies will be imported in the background, and you will get an email when it is finished.</p>
                       <div className="row">
                         <div className="col-md-6 col-md-offset-3">
                            <BulkImportConnected onSubmit={::this.handleSubmit}/>
                        </div>
                        </div>
            </Widget>
        </LawBrowserContainer>
    }

}



export default class ImportPage extends React.Component {
    render() {
        return <div>
            <ImportSingleFull initialValue={ this.props.location ? this.props.location.query.value : null }/>
            <RealMeConnect />
            <ImportBulk />
        </div>
    }
}
