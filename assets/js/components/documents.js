"use strict";
import React from 'react';
import {requestResource, deleteResource} from '../actions';
import { pureRender } from '../utils';
import { connect } from 'react-redux';
import ButtonInput from './forms/buttonInput';
import AuthenticatedComponent from  './authenticated';
import { Link } from 'react-router'

@connect(state => state.resources.documents)
@AuthenticatedComponent
@pureRender
export default class Users extends React.Component {

    componentDidMount(){
        this.props.dispatch(requestResource('documents'));
    }

    componentDidUpdate(){
        this.props.dispatch(requestResource('documents'));
    }

    submit(id, e) {
        e.preventDefault();
        this.props.dispatch(deleteResource('/document/'+id));
    }

    render() {
        let fields = ['id', 'filename', 'type', 'createdAt', 'updatedAt'];
        return <table className="table">
        <thead><tr>{ fields.map(f => <th key={f}>{f}</th>) }<th></th><th></th></tr></thead>
        <tbody>
        {this.props.data ? this.props.data.map(
            (row, i) => <tr key={i}>
                { fields.map(f => <td key={f}>{row[f]}</td>) }
                <td><Link activeClassName="active" className="nav-link" to={"/document/view/"+row.id} >View</Link></td>
                <td><a href="#" type='button' value='Delete' onClick={this.submit.bind(this, row.id)}  >Delete</a></td>
            </tr>)

        : null}
        </tbody>
        </table>
    }
}

