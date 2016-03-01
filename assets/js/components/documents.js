"use strict";
import React, { PropTypes } from 'react';
import { requestResource, deleteResource } from '../actions';
import { pureRender } from '../utils';
import { connect } from 'react-redux';
import ButtonInput from './forms/buttonInput';
import { Link } from 'react-router'
import STRINGS from '../strings'


@connect(state => state.resources.documents)
export default class Documents extends React.Component {

    componentDidMount(){
        this.props.dispatch(requestResource('documents'));
    }

    componentDidUpdate(){
        this.props.dispatch(requestResource('documents'));
    }

    submitDelete(id, e) {
        e.preventDefault();
        this.props.dispatch(deleteResource('/document/'+id));
    }

    render() {
        let fields = ['id', 'filename', 'type', 'createdAt', 'updatedAt'];
        return <div className="container"><table className="table">
        <thead><tr>{ fields.map(f => <th key={f}>{f}</th>) }<th></th><th></th></tr></thead>
        <tbody>
        {this.props.data ? this.props.data.map(
            (row, i) => <tr key={i}>
                { fields.map(f => <td key={f}>{row[f]}</td>) }
                <td><Link activeClassName="active" className="nav-link" to={"/document/view/"+row.id} >View</Link></td>
                <td><a href="#" type='button' value='Delete' onClick={this.submitDelete.bind(this, row.id)}  >Delete</a></td>
            </tr>)

        : null}
        </tbody>
        </table>
        </div>
    }
}


export class CompanyDocuments extends React.Component {
    static propTypes = {
        companyState: PropTypes.object
    };

    renderField(key, value) {
        switch(key){
            case 'date':
            case 'createdAt':
                return new Date(value).toDateString();
            default:
                return value;
        }
    }

    render() {
        const docList = this.props.companyState.docList;
        let fields = ['id', 'filename', 'type', 'date', 'createdAt'];
        return <div className="container"><table className="table table-hover table-striped">
        <thead><tr>{ fields.map(f => <th key={f}>{STRINGS.companyDocuments[f]}</th>) }<th></th></tr></thead>
        <tbody>
        { docList.documents.map(
            (row, i) => <tr key={i}>
                { fields.map(f => <td key={f}>{this.renderField(f, row[f])}</td>) }
                <td><Link activeClassName="active" className="nav-link" to={"/document/view/"+row.id} >View</Link></td>
            </tr>)}
        </tbody>
        </table>
        </div>
    }
}
