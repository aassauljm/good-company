"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux'
import { asyncConnect } from 'redux-connect';
import { requestResource, updateResource } from '../actions';
import { stringDateToFormattedString, stringDateToFormattedStringTime } from '../utils'
import { Link } from 'react-router'
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import ReactCSSTransitionGroup from 'react/lib/ReactCSSTransitionGroup';
import STRINGS from '../strings';
import LawBrowserContainer from './lawBrowserContainer'
import LawBrowserLink from './lawBrowserLink';
import Button from 'react-bootstrap/lib/Button';

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
    userInfo: state.userInfo,
    sourceData: state.resources[`/company/${ownProps.companyId}/source_data`] || {},
    update: state.resources[`/company/${ownProps.companyId}/update_source_data`] || {}
}), {
    requestData: (key) => requestResource(`/company/${key}/source_data`),
    updateData: (key) => updateResource(`/company/${key}/update_source_data`)
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

    key() {
        return this.props.companyId;
    }


    renderBody() {
        if(this.props.sourceData._status  === 'fetching' || !this.props.sourceData._status ){
            return <div className="loading" key="loading">
                    <Glyphicon glyph="refresh" className="spin"/>
                </div>
        }

        if(this.props.update._status  === 'fetching' ){
            return <div>
                <div className="text-center">
                 Checking Companies Office for changes...
            </div>
                <div className="loading" key="loading">
                    <Glyphicon glyph="refresh" className="spin"/>
                </div>
                </div>
        }


        const source = (this.props.sourceData.data || {}).latestSourceData || (this.props.sourceData.data || {}).currentSourceData;
        const data = source.data;
        const hasCompaniesIntegration = this.props.userInfo.mbieServices.indexOf('companies_office') >= 0;

        return (
            <div className="row" key="body">
                <div className="col-xs-6">
                        <div><strong>Name</strong> {renderValue(data.companyName) }</div>
                        <div><strong>{STRINGS.companyNumber}</strong> { renderValue(data.companyNumber) }</div>
                        <div><strong>{STRINGS.nzbn}</strong> { renderValue(data.nzbn) }</div>
                        <div><strong>{STRINGS.incorporationDate}</strong> {renderValue(data.incorporationDate) } </div>
                        </div>
                <div className="col-xs-6">
                        <div><strong>{ STRINGS.arFilingMonth}</strong> {renderValue(data.arFilingMonth) }</div>
                        <div><strong>{ STRINGS.entityType}</strong> { renderValue(data.entityType) }</div>
                        <div><strong>{ STRINGS.compayStatus}</strong> { renderValue(data.companyStatus) }</div>
                        <div><strong>{ STRINGS.ultimateHoldingCompany}</strong> { renderValue(data.ultimateHoldingCompany)}</div>
                        <div><strong>{STRINGS.constitutionFiled}</strong> { renderValue(data.constitutionFiled) } </div>
                        { data.fraReportingMonth && <div><strong> { STRINGS.fraReportingMonth}</strong> {data.fraReportingMonth }</div> }
                </div>
                { data.createdAt && <div className="col-xs-12 text-center">
                    { data.createdAt && <div><em>Data sourced from the Companies Register at { stringDateToFormattedStringTime(data.createdAt) }</em></div> }
                    <a className="external-link" href={`https://www.business.govt.nz/companies/app/ui/pages/companies/${data.companyNumber}`} target="blank">View at Companies Register</a>
                </div> }
                <div className="col-xs-12">
                    <hr />
                    { !hasCompaniesIntegration &&
                        <div className="text-center">
                            <button className="btn btn-info">Connect with Companies Office</button>
                        </div>
                    }
                    { hasCompaniesIntegration &&
                        <div className="text-center">
                            <div>
                                <Glyphicon glyph="ok" />&nbsp;&nbsp;
                                <strong>Connected with Companies Office</strong>
                            </div>
                            <button className='btn btn-warning'>Disconnect from Companies Office</button>
                        </div>
                    }
                </div>
                <div className="button-row">
                    <Button bsStyle="info" onClick={() => this.props.updateData(this.props.companyId)}>Check Companies Office for Updates</Button>
                </div>
            </div>
        )
    }

    render() {
        const data = (this.props.data || {}).data || {};
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    <span className="fa fa-bank" /> Companies Register
                </div>
                <div className="widget-control">
                 { <Link to={`/company/view/${this.key()}/source_data`} >View All</Link>  }
                </div>
            </div>

            <div className="widget-body">
                <ReactCSSTransitionGroup component="div" transitionName="widget-transition" transitionEnterTimeout={transition} transitionLeaveTimeout={transition}>
                { this.renderBody() }
               </ReactCSSTransitionGroup>
            </div>
        </div>
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


@connect((state, ownProps) => {
    return {sourceData: state.resources[`/company/${ownProps.companyId}/source_data`] || {}, update: state.resources[`/company/${ownProps.companyId}/update_source_data`] || {}}
}, {
    requestData: (key) => requestResource(`/company/${key}/source_data`),
    updateData: (key) => updateResource(`/company/${key}/update_source_data`)
})
export default class CompaniesRegister extends React.Component {
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

    renderBody() {
        if(this.props.sourceData._status  === 'fetching' || !this.props.sourceData._status ){
            return <div className="loading" key="loading">
                    <Glyphicon glyph="refresh" className="spin"/>
                </div>
        }
        if(this.props.update._status  === 'fetching' ){
            return <div>
                <div className="text-center">
                 Checking Companies Office for changes...
            </div>
                <div className="loading" key="loading">
                    <Glyphicon glyph="refresh" className="spin"/>
                </div>
                </div>
        }

        const source = (this.props.sourceData.data || {}).latestSourceData || (this.props.sourceData.data || {}).currentSourceData;
        return <div key="body">
            <div className="text-center">
                <a className="external-link" href={`https://www.business.govt.nz/companies/app/ui/pages/companies/${source.data.companyNumber}`} target="blank">View at Companies Office</a>
            </div>
            { fields.map((f, i) => {
                return <div className="row" key={i}><div className="col-md-3 "><strong>{ STRINGS[f]}</strong></div><div className="col-md-9">{ renderValue(source.data[f])}</div></div>
            })}
            <div className="text-center">
                 { source.createdAt && <div><em>Data sourced from the Companies Register at { stringDateToFormattedStringTime(source.createdAt) }</em></div> }
            </div>
            <div className="button-row">
            <Button bsStyle="info" onClick={() => this.props.updateData(this.props.companyId)}>Check Companies Office for Updates</Button>
            </div>
        </div>
    }

    render() {
        return <LawBrowserContainer lawLinks={companiesRegisterLawLinks()}>
            <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    Companies Register
                </div>
            </div>

            <div className="widget-body">
                { this.renderBody() }
            </div>
        </div>
        </LawBrowserContainer>
    }
}