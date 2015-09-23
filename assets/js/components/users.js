"use strict";
import React from 'react';
import {requestResource} from '../actions';
import pureRender from 'pure-render-decorator';
import { connect } from 'react-redux';


@pureRender
@connect(state => state.resources.users)
export default class Users extends React.Component {

    componentDidMount(){
        this.props.dispatch(requestResource('users'));
    }

    componentDidUpdate(){
        this.props.dispatch(requestResource('users'));
    }

    render() {
        let fields = ['id', 'username', 'createdAt', 'updatedAt'];
        return <table className="table">
        <thead><tr>{ fields.map(f => <th>{f}</th>) }</tr></thead>
        <tbody>
        {this.props.list ? this.props.list.map(
            (row, i) => <tr key={i}>
                { fields.map(f => <td>{row[f]}</td>) }
            </tr>)

        : null}
        </tbody>
        </table>
    }
}

