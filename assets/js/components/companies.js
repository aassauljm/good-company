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

@asyncConnect([{
  promise: ({store: {dispatch, getState}}) => {
    return dispatch(requestResource('companies'));
  }
}])
@connect(state => state.resources.companies)
export default class Companies extends React.Component {
    handleClick(id, event) {
        event.preventDefault();
        const { dispatch } = this.props;
        dispatch(push("/company/view/"+ id));
    }

    handleNew() {
        this.props.dispatch(startCreateCompany('createCompanyModal'))
    }

    handleImport() {
        this.props.dispatch(startImportCompany('importCompanyModal'))
    }

    render() {
        const fields = ['id', 'companyName', 'companyNumber', 'nzbn'];
        const data = (this.props.data || []).map(c => ({...c.currentCompanyState, ...c}))
        return <div className="container">
           <div className="button-row">
                { /* <Button bsStyle="success" onClick={::this.handleNew }>Create New</Button> */ }
                <Button bsStyle="info" className="company-import" onClick={::this.handleImport}>Import Company</Button>
            </div>
            <div className="table-responsive">
            <table className="table table-striped table-hover">
                <thead><tr>{ fields.map(f => <th key={f}>{STRINGS[f]}</th>) }</tr></thead>
                <tbody>
                { data.map(
                    (row, i) => <tr key={i} onClick={this.handleClick.bind(this, row.id)}>
                        { fields.map(f => <td key={f}>{row[f]}</td>) }
                    </tr>) }
                </tbody>
            </table>
        </div>
        </div>

    }
}

