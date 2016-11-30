"use strict";
import React from 'react';
import {requestResource, deleteResource, startCreateCompany, startImportCompany} from '../actions';
import { pureRender } from '../utils';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import { push } from 'react-router-redux'
import { Link } from 'react-router';
import STRINGS from '../strings'
import { asyncConnect } from 'redux-connect';
import { requestAlerts } from './alerts';
import { CompanyAlertsBase } from './companyAlerts';


const DEFAULT_OBJ = {};


const CompanyItem = (props) => {
    return <div className="company-view">
        <Link to={`/company/view/${props.company.id}`}>
        <h2>{ props.company.companyName }</h2>
        <h3><span className="sub-label">{ STRINGS['companyNumber'] }:</span> { props.company.companyNumber }</h3>
        <h3><span className="sub-label">{ STRINGS['nzbn'] }:</span> { props.company.nzbn }</h3>
        <h3><span className="sub-label">{ STRINGS['companyStatus'] }:</span> { props.company.companyStatus }</h3>
        <h3><span className="sub-label">{ STRINGS['entityType'] }:</span> { props.company.entityType }</h3>
        </Link>
        <CompanyAlertsBase companyState={props.company} companyId={`${props.company.id}`} showTypes={['danger', 'warning', 'pending']} showAllWarnings={true}/>
    </div>
}


const CompaniesRenderHOC = ComposedComponent => class extends React.Component {

    renderTable(data, condensed) {
        const handleClick = (event, id) => {
            event.preventDefault();
            this.props.push(id);
        }
        const fields = ['id', 'companyName', 'companyNumber', 'nzbn'];
        let className = "table table-striped table-hover ";
        if(condensed){
            className += "table-condensed ";
        }
        return <div className="table-responsive">
        <table className={className}>
            <thead><tr>{ fields.map(f => <th key={f}>{STRINGS[f]}</th>) }</tr></thead>
            <tbody>
            { data.filter(d => !d.deleted).map(
                (row, i) => <tr key={i} onClick={(e) => handleClick(e, row.id) }>
                    { fields.map(f => <td key={f}>{row[f]}</td>) }
                </tr>) }
            </tbody>
        </table>
        </div>
    }

    renderList(data) {
        return <div className="company-list col-md-8 col-md-offset-2">
            {
                data.map((company, i) => <CompanyItem company={company} key={i} />)
            }
        </div>
    }

    render() {
        return <ComposedComponent {...this.props} renderTable={::this.renderTable} renderList={::this.renderList}/>;
    }
}



@asyncConnect([{
    promise: ({store: {dispatch, getState}}) => {
        return dispatch(requestResource('companies'));
    }
}],
    state => ({companies: state.resources[`companies`] || DEFAULT_OBJ, alerts: state.resources['/alerts'] || DEFAULT_OBJ}),
{
    push: (id) => push(`/company/view/${id}`),
    handleImport: () => push('/import'),
    fetchAlerts: requestAlerts,
})
@CompaniesRenderHOC
export default class Companies extends React.Component {

    componentWillMount() {
        this.props.fetchAlerts();
    }

    componentWillUpdate() {
        this.props.fetchAlerts();
    }

    renderBody() {
        const mappedAlerts = (this.props.alerts.data || []).companyMap || {};

        const data = (this.props.companies.data || [])
            .map(c => ({...c.currentCompanyState, ...c}))
            .map(d => {
                d.warnings = (mappedAlerts[d.id] || DEFAULT_OBJ).warnings || DEFAULT_OBJ;
                d.deadlines = (mappedAlerts[d.id] || DEFAULT_OBJ).deadlines || DEFAULT_OBJ;
                return d;
            });

        return <div className="company-list-body">
           <div className="button-row">
                { /* <Button bsStyle="success" onClick={::this.handleNew }>Create New</Button> */ }
                <Button bsStyle="info" className="company-import" onClick={this.props.handleImport}>Bulk Import</Button>
            </div>
            { this.props.renderTable(data) }
        </div>

    }

    render() {
        return <div className="container">

            <div className="widget">
                <div className="widget-header">
                    <div className="widget-title">
                        Companies
                    </div>
                </div>
                <div className="widget-body">
                    { this.renderBody() }
                </div>
            </div>
        </div>
    }
}

@asyncConnect([{
    promise: ({store: {dispatch, getState}}) => {
        return dispatch(requestResource('companies'));
    }
}],
    state => ({companies: state.resources[`companies`]}),
{
    requestData: () => requestResource(`companies`),
    handleImport: () => push('/import'),
    push: (id) => push(`/company/view/${id}`)
})
@CompaniesRenderHOC
export class CompaniesWidget extends React.Component {

    fetch() {
        return this.props.requestData();
    }

    componentDidMount() {
        this.fetch();
    }

    componentDidUpdate() {
        this.fetch();
    };

    renderBody() {
        const data = (this.props.companies.data || []).map(c => ({...c.currentCompanyState, ...c}))
        return  <div className="widget-body">

            { this.props.renderTable(data.slice(0, 6), true) }
           <div className="button-row">
                { /* <Button bsStyle="success" onClick={::this.handleNew }>Create New</Button> */ }
                <Button bsStyle="info" className="company-import" onClick={this.props.handleImport}>Bulk Import</Button>
            </div>
        </div>
    }

    render() {
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    <span className="fa fa-institution"/> Companies
                </div>
                <div className="widget-control">
                 <Link to={`/companies`} >View All</Link>
                </div>
            </div>
            { this.renderBody() }
        </div>
    }
}
