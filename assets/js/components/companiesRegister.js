"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux'
import { asyncConnect } from 'redux-connect';
import { requestResource, updateResource, resetResources, addNotification } from '../actions';
import { stringDateToFormattedString, stringDateToFormattedStringTime } from '../utils'
import { Link } from 'react-router'
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import ReactCSSTransitionGroup from 'react/lib/ReactCSSTransitionGroup';
import STRINGS from '../strings';
import LawBrowserContainer from './lawBrowserContainer'
import LawBrowserLink from './lawBrowserLink';
import Button from 'react-bootstrap/lib/Button';
import Widget from './widget';



const companiesRegisterLawLinks = () => <div>
        <LawBrowserLink title="Companies Act 1993" location=" s 360(1)+(4)">Registrar to keep companies register</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 360A">Rectification or correction of companies register</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 362">Registration of documents</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 363">Inspection of companies register</LawBrowserLink>
    </div>


const transition = __SERVER__ ? 0 : 200;

const fields = [
'companyName',
'companyNumber',
'nzbn',
'incorporationDate',
'arFilingMonth',
'fraReportingMonth',
'entityType',
'companyStatus',
'constitutionFiled',
'ultimateHoldingCompany'];


@connect((state, ownProps) => ({
    update: state.resources[`/company/${ownProps.companyId}/update_source_data`] || {},
}), {
    updateData: (key) => updateResource(`/company/${key}/update_source_data`, {}, {invalidates: []}),
    refresh: () => resetResources(),
    addNotification: (...args) => addNotification(...args)
})
export class UpdateSourceData extends React.PureComponent {
    updateData() {
        this.props.updateData(this.key())
            .then(result => {
                if(result.response.sourceDataUpdated){
                    this.props.addNotification({message: 'New company records found'})
                    this.props.refresh();
                }
                else{
                    this.props.addNotification({message: 'This company is up to date'})
                }
            })
            .catch(() => {
                this.props.addNotification({message: 'Failed to update data from Companies Register', error: true})
            });
    }

    key() {
        return this.props.companyId;
    }

    render(){
        const doingUpdate = this.props.update._status   === 'fetching';
        if(!doingUpdate){
            return <Button bsStyle="info" onClick={() => this.updateData()}>Check for Updates</Button>
        }
        return <Button bsStyle="info"> <Glyphicon glyph="refresh" className="spin"/> Checking for Updates</Button>
    }
}


const renderLastARFiled = (companyState) => {
    const date = companyState.deadlines.annualReturn && companyState.deadlines.annualReturn.lastFiling;
    if(date){
        return stringDateToFormattedString(date)
    }
    return 'Never'
}

@connect((state, ownProps) => ({
    userInfo: state.userInfo,
    sourceData: state.resources[`/company/${ownProps.companyId}/source_data`] || {},
    authority: state.resources[`/company/${ownProps.companyId}/update_authority`] || {}
}), {
    requestData: (key) => requestResource(`/company/${key}/source_data`),
    updateAuthority: (key) => updateResource(`/company/${key}/update_authority`, {}, {invalidates: []}),
    refresh: () => resetResources()
})
export class CompaniesRegisterWidget extends React.Component {

    fetch() {
        return this.props.requestData(this.props.companyId);
    };

    componentDidMount() {
        this.fetch();
    };

    componentDidUpdate() {
        this.fetch();
    };

    updateData() {
        this.props.updateData(this.key())
            .then(result => {
                if(result.response.sourceDataUpdated){
                    this.props.addNotification({message: 'New company records found'})
                    this.props.refresh();
                }
                else{
                    this.props.addNotification({message: 'This company is up to date'})
                }
            })
            .catch(() => {
                this.props.addNotification({message: 'Failed to update data from Companies Register', error: true})
            });
    }

    updateAuthority(existing) {
        this.props.updateAuthority(this.key())
            .then(result => {
                if(result.response.hasAuthority !== existing){
                    this.props.refresh();
                }
            });
    }

    key() {
        return this.props.companyId;
    }

    authority(hasAuthority) {
        const doingAuthorityUpdate = this.props.authority._status === 'fetching';
        if(doingAuthorityUpdate){
            return <Button bsStyle="info"> <Glyphicon glyph="refresh" className="spin"/> Updating Authority</Button>
        }
        const hasCompaniesOfficeIntegration = this.props.userInfo.mbieServices.indexOf('companies-office') >= 0;
        if(!hasCompaniesOfficeIntegration){
            return <Link className="btn btn-info" to={'/companies_office_integration'}>Connect with Companies Office</Link>
        }

        if(hasAuthority === false){
            return <Button bsStyle="info" onClick={() => this.updateAuthority(hasAuthority)}>Recheck Authority</Button>
        }
        return <Button bsStyle="info" onClick={() => this.updateAuthority(hasAuthority)}>Check Authority</Button>
    }

    renderBody() {
        const fetching = this.props.sourceData._status  === 'fetching' || !this.props.sourceData._status;

        if(fetching){
            return <div className="loading" key="loading">
                    <Glyphicon glyph="refresh" className="spin"/>
                </div>
        }

        const source = (this.props.sourceData.data || {}).latestSourceData || (this.props.sourceData.data || {}).currentSourceData;
        const data = source.data;
        const authority = this.props.companyState.authority;
        return <div className="row" key="body">

            <div className="col-xs-6">
                    <div><strong>Name</strong> {renderValue(data.companyName) }</div>
                    <div><strong>{STRINGS.companyNumber}</strong> { renderValue(data.companyNumber) }</div>
                    <div><strong>{STRINGS.nzbn}</strong> { renderValue(data.nzbn) }</div>
                    <div><strong>{STRINGS.incorporationDate}</strong> {renderValue(data.incorporationDate) } </div>
                    <div><strong>{STRINGS.constitutionFiled}</strong> { renderValue(data.constitutionFiled) } </div>
                    </div>
            <div className="col-xs-6">
                    <div><strong>{ STRINGS.arFilingMonth}</strong> {renderValue(data.arFilingMonth) }</div>
                    <div><strong>Last AR Filed</strong> { renderLastARFiled(this.props.companyState) }</div>
                    <div><strong>{ STRINGS.entityType}</strong> { renderValue(data.entityType) }</div>
                    <div><strong>{ STRINGS.compayStatus}</strong> { renderValue(data.companyStatus) }</div>
                    <div><strong>{ STRINGS.ultimateHoldingCompany}</strong> { renderValue(data.ultimateHoldingCompany)}</div>
                    { data.fraReportingMonth && <div><strong> { STRINGS.fraReportingMonth}</strong> {data.fraReportingMonth }</div> }
            </div>
            { data.createdAt && <div className="col-xs-12 text-center">
                { data.createdAt && <div><em>Data sourced from the Companies Register at { stringDateToFormattedStringTime(data.createdAt) }</em></div> }
                <CompaniesOfficeLink companyNumber={data.companyNumber} text={'View at Companies Office'}/>
            </div> }
            <div className="col-xs-12 text-center"><p></p>
                <p>
                     { authority && <strong className="text-success">You have authority to update on the Companies Register</strong>}
                     { authority === false && <strong className="text-danger">You do not have authority to update on the Companies Register</strong>}
                     { authority === null && <span><strong className="text-warning">Your authority for this company is unknown. </strong>
                     <a className="external-link" href="https://www.companiesoffice.govt.nz/companies/learn-about/company-authority" target="_blank">Learn more <Glyphicon glyph="new-window"/></a></span>}
                </p>
            </div>
            <div className="button-row">
                { this.authority(authority) }
                 <UpdateSourceData companyId={this.props.companyId} />
            </div>
        </div>
    }

    render() {
        const data = (this.props.data || {}).data || {};
        return <Widget iconClass="fa fa-bank" title="Companies Register" link={`/company/view/${this.key()}/source_data`}>
                { this.renderBody() }
                </Widget>
    }
}

function renderValue(value){
    if(value === true){
        return 'Yes';
    }
    if(value === false){
        return 'No'
    }
    if(value){
        return value;
    }
    return "Unknown";
}



@connect((state, ownProps) => ({
    userInfo: state.userInfo,
    sourceData: state.resources[`/company/${ownProps.companyId}/source_data`] || {},
    authority: state.resources[`/company/${ownProps.companyId}/update_authority`] || {}
}), {
    requestData: (key) => requestResource(`/company/${key}/source_data`),
    updateAuthority: (key) => updateResource(`/company/${key}/update_authority`, {}, {invalidates: []}),
    refresh: () => resetResources()
})
export default class CompaniesRegister extends React.PureComponent {
    fetch() {
        return this.props.requestData(this.props.companyId);
    };
    componentDidMount() {
        this.fetch();
    };

    componentDidUpdate() {
        this.fetch();
    };

    key() {
        return this.props.companyId;
    }

    updateAuthority(existing) {
        this.props.updateAuthority(this.key())
            .then(result => {
                if(result.response.hasAuthority !== existing){
                    this.props.refresh();
                }
            });
    }

    authority(hasAuthority) {
        const doingAuthorityUpdate = this.props.authority._status === 'fetching';
        if(doingAuthorityUpdate){
            return <Button bsStyle="info"> <Glyphicon glyph="refresh" className="spin"/> Updating Authority</Button>
        }
        const hasCompaniesOfficeIntegration = this.props.userInfo.mbieServices.indexOf('companies-office') >= 0;
        if(!hasCompaniesOfficeIntegration){
            return <Link className="btn btn-info" to={'/companies_office_integration'}>Connect with Companies Office</Link>
        }

        if(hasAuthority === false){
            return <Button bsStyle="info" onClick={() => this.updateAuthority(hasAuthority)}>Recheck Authority</Button>
        }
        return <Button bsStyle="info" onClick={() => this.updateAuthority(hasAuthority)}>Check Authority</Button>
    }

    renderBody() {
        const fetching = this.props.sourceData._status  === 'fetching' || !this.props.sourceData._status;


        if(fetching ){
            return <div className="loading" key="loading">
                    <Glyphicon glyph="refresh" className="spin"/>
                </div>
        }
        const authority = this.props.companyState.authority;
        const source = (this.props.sourceData.data || {}).latestSourceData || (this.props.sourceData.data || {}).currentSourceData;
        return <div key="body">
            <div className="text-center">
                <a className="external-link" href={`https://www.business.govt.nz/companies/app/ui/pages/companies/${source.data.companyNumber}`} target="blank">View at Companies Office <Glyphicon glyph="new-window"/></a>
            </div>

            { fields.map((f, i) => {
                return <div className="row" key={i}><div className="col-md-3 "><strong>{ STRINGS[f]}</strong></div><div className="col-md-9">{ renderValue(source.data[f])}</div></div>
            })}
            <div className="row"><div className="col-md-3 "><strong>Last AR Filed</strong></div><div className="col-md-9">{ renderLastARFiled(this.props.companyState) }</div></div>
            <div className="text-center">
                 { source.createdAt && <div><em>Data sourced from the Companies Register at { stringDateToFormattedStringTime(source.createdAt) }</em></div> }
            </div>

            <div className="text-center"><p></p>
                <p>
                     { authority && <strong className="text-success">You have authority to update on the Companies Register</strong>}
                     { authority === false && <strong className="text-danger">You do not have authority to update on the Companies Register</strong>}
                     { authority === null && <span><strong className="text-warning">Your authority for this company is unknown. </strong>
                     <a className="external-link" href="https://www.companiesoffice.govt.nz/companies/learn-about/company-authority" target="_blank">Learn more <Glyphicon glyph="new-window"/></a></span>}
                </p>
            </div>

            <div className="button-row">
                { this.authority(authority) }
                <UpdateSourceData companyId={this.props.companyId} />
            </div>
        </div>
    }

    render() {
        return <LawBrowserContainer lawLinks={companiesRegisterLawLinks()}>
            <Widget iconClass="fa fa-bank" title="Companies Register">
                { this.renderBody() }
                </Widget>
        </LawBrowserContainer>
    }
}


export const CompaniesOfficeLink = (props) => {
    return <a className="external-link" href={`https://www.business.govt.nz/companies/app/ui/pages/companies/${props.companyNumber}`} target="blank">{props.text}</a>
}