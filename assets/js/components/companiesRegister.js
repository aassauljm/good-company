"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux'
import { asyncConnect } from 'redux-connect';
import { requestResource } from '../actions';
import { stringToDate } from '../utils'
import { Link } from 'react-router'
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import ReactCSSTransitionGroup from 'react/lib/ReactCSSTransitionGroup';
import STRINGS from '../strings';
import LawBrowserContainer from './lawBrowserContainer'
import LawBrowserLink from './lawBrowserLink';


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
'entityType',
'companyStatus'];


@connect((state, ownProps) => {
    return state.resources[`/company/${ownProps.companyId}/source_data`] || {};
}, {
    requestData: (key) => requestResource(`/company/${key}/source_data`)
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
        if(this.props._status  === 'fetching' || !this.props._status ){
            return <div className="loading" key="loading">
                        <Glyphicon glyph="refresh" className="spin"/>
                    </div>
        }
        const data = (this.props.data || {}).data || {};
        return <div className="row" key="body">
            <div className="col-xs-6">
                    <div><strong>Name</strong> {data.companyName}</div>
                    <div><strong>Company  Number</strong> {data.companyNumber ||  'Unknown'}</div>
                    <div><strong>NZ Business Number</strong> {data.nzbn ||  'Unknown'}</div>
                    <div><strong>Incorporation Date</strong> { data.incorporationDate}</div>
                    </div>
            <div className="col-xs-6">
                    <div><strong>AR Filing Month</strong> {data.arFilingMonth ||  'Unknown'}</div>
                    <div><strong>Entity Type</strong> {data.entityType ||  'Unknown' }</div>
                    <div><strong>Status</strong> {data.companyStatus ||  'Unknown' }</div>
            </div>
            <div className="col-xs-12 text-center">
                <a className="external-link" href={`https://www.business.govt.nz/companies/app/ui/pages/companies/${data.companyNumber}`} target="blank">View at Companies Office</a>
            </div>
        </div>
    }

    render() {
        const data = (this.props.data || {}).data || {};
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    Companies Register
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


@connect((state, ownProps) => {
    return state.resources[`/company/${ownProps.companyId}/source_data`] || {};
}, {
    requestData: (key) => requestResource(`/company/${key}/source_data`)
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
        if(this.props._status  === 'fetching' || !this.props._status ){
            return <div className="loading" key="loading">
                    <Glyphicon glyph="refresh" className="spin"/>
                </div>
        }
        const data = (this.props.data || {}).data || {};
        return <div key="body">
            { fields.map((f, i) => {
                return <div className="row" key={i}><div className="col-md-3 "><strong>{ STRINGS[f]}</strong></div><div className="col-md-9">{ data[f] || "Unknown"}</div></div>
            })}
            <div className="text-center">
                <a className="external-link" href={`https://www.business.govt.nz/companies/app/ui/pages/companies/${data.companyNumber}`} target="blank">View at Companies Office</a>
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
