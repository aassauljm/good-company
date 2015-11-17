"use strict";
import React from 'react';
import {requestResource, deleteResource, startCreateCompany} from '../actions';
import { pureRender } from '../utils';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import AuthenticatedComponent from  './authenticated';
import { pushState } from 'redux-router';
import { Link } from 'react-router';
import STRINGS from '../strings'

@connect(state => state.resources.companies)
@AuthenticatedComponent
export default class Companies extends React.Component {

    componentDidMount() {
        this.props.dispatch(requestResource('companies'));
    }

    componentDidUpdate() {
        this.props.dispatch(requestResource('companies'));
    }

    handleClick(id, event) {
        event.preventDefault();
        const { dispatch } = this.props;
        dispatch(pushState(null, "/company/view/"+ id));
    }

    handleNew() {
        this.props.dispatch(startCreateCompany())
    }

    render() {
        const fields = ['id', 'companyName', 'companyNumber', 'nzbn'];
        const data = (this.props.data || []).map(c => ({...c.currentCompanyState, ...c}))
        return <div>
           <ButtonToolbar className="text-center">
                <Button bsStyle="success" onClick={::this.handleNew }>Create New</Button>
                <Button bsStyle="info" >Import Company</Button>
            </ButtonToolbar>
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

