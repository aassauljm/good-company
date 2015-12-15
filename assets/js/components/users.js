"use strict";
import React from 'react';
import {requestResource, deleteResource} from '../actions';
import { pureRender } from '../utils';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import AuthenticatedComponent from  './authenticated';

@connect(state => state.resources.users)
@AuthenticatedComponent
@pureRender
export default class Users extends React.Component {

    componentDidMount(){
        this.props.dispatch(requestResource('users'));
    }

    componentDidUpdate(){
        this.props.dispatch(requestResource('users'));
    }

    submit(id, e) {
        e.preventDefault();
        this.props.dispatch(deleteResource('/user/'+id));
    }

    render() {
        let fields = ['id', 'username', 'createdAt', 'updatedAt'];
        return <div className="container">
            <table className="table">
            <thead><tr>{ fields.map(f => <th key={f}>{f}</th>) }<th></th><th></th></tr></thead>
            <tbody>
            {this.props.data ? this.props.data.map(
                (row, i) => <tr key={i}>
                    { fields.map(f => <td key={f}>{row[f]}</td>) }
                    <td><Link activeClassName="active" className="nav-link" to={"/user/edit/"+row.id} >Edit</Link></td>
                    <td><a href="#" onClick={this.submit.bind(this, row.id)} >Delete</a></td>
                </tr>)

            : null}
            </tbody>
            </table>
        <Link activeClassName="active" className="nav-link" to={"/user/create"}>Create User</Link>
        </div>
    }
}

