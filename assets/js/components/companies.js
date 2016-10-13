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

const CompaniesHOC = ComposedComponent => class extends React.Component {

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
        return <table className={className}>
            <thead><tr>{ fields.map(f => <th key={f}>{STRINGS[f]}</th>) }</tr></thead>
            <tbody>
            { data.filter(d => !d.deleted).map(
                (row, i) => <tr key={i} onClick={(e) => handleClick(e, row.id) }>
                    { fields.map(f => <td key={f}>{row[f]}</td>) }
                </tr>) }
            </tbody>
        </table>
    }

    renderList(data) {
        return <div className="company-list">
            {
                data.map((company => {
                    return <div className="company-view">
                        <h4>{ company }</h4>

                    </div>
                }))
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
state => state.resources.companies,
{
    push: (id) => push(`/company/view/${id}`),
    handleImport: () => push('/import')
})
@CompaniesHOC
export default class Companies extends React.Component {

    renderBody() {
        const data = (this.props.data || []).map(c => ({...c.currentCompanyState, ...c}))
        return <div>
           <div className="button-row">
                { /* <Button bsStyle="success" onClick={::this.handleNew }>Create New</Button> */ }
                <Button bsStyle="info" className="company-import" onClick={this.props.handleImport}>Bulk Import</Button>
            </div>
            <div className="table-responsive">
                { this.props.renderList(data) }
            </div>
        </div>

    }

    render() {
        return <div className="container">
            <div className="row">
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
        </div>
    }
}

@connect((state, ownProps) => {
    return state.resources[`companies`] || {};
}, {
    requestData: () => requestResource(`companies`),
    handleImport: () => push('/import'),
    push: (id) => push(`/company/view/${id}`)
})
@CompaniesHOC
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
        const data = (this.props.data || []).map(c => ({...c.currentCompanyState, ...c}))
        return  <div className="widget-body">
        <div className="table-responsive">
            { this.props.renderTable(data.slice(0, 6), true) }
        </div>
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
                    Companies
                </div>
                <div className="widget-control">
                 <Link to={`/companies`} >View All</Link>
                </div>
            </div>
            { this.renderBody() }
        </div>
    }
}
