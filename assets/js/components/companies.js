"use strict";
import React from 'react';
import {requestResource, deleteResource} from '../actions';
import { pureRender } from '../utils';
import { connect } from 'react-redux';
import ButtonInput from './forms/buttonInput';
import LookupCompany from  './lookupCompany';
import AuthenticatedComponent from  './authenticated';
import { Link } from 'react-router';


@connect(state => state.resources.companies)
@AuthenticatedComponent
export default class Companies extends React.Component {

    componentDidMount(){
        this.props.dispatch(requestResource('companies'));
    }

    componentDidUpdate(){
        this.props.dispatch(requestResource('companies'));
    }

    render() {
        const fields = ['id', 'companyName'];
        const data = (this.props.data || []).map(c => ({...c.currentCompanyState, ...c}))
        return <div>
        <LookupCompany />
        <table className="table">
        <thead><tr>{ fields.map(f => <th key={f}>{f}</th>) }<th></th></tr></thead>
        <tbody>
        { data.map(
            (row, i) => <tr key={i}>
                { fields.map(f => <td key={f}>{row[f]}</td>) }
                <td><Link activeClassName="active" className="nav-link" to={"/company/view/"+row.id} >View</Link></td>
            </tr>) }
        </tbody>
        </table>
        </div>
    }
}

