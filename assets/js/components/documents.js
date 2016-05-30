"use strict";
import React, { PropTypes } from 'react';
import { requestResource, deleteResource } from '../actions';
import { pureRender, stringToDate } from '../utils';
import { connect } from 'react-redux';
import ButtonInput from './forms/buttonInput';
import { Link } from 'react-router'
import STRINGS from '../strings'
import { asyncConnect } from 'redux-connect';


@asyncConnect([{
  promise: ({store: {dispatch, getState}, params}) => {
    return dispatch(requestResource('documents'));
  }
}])
@connect(state => state.resources.documents)
export default class Documents extends React.Component {

    submitDelete(id, e) {
        e.preventDefault();
        this.props.dispatch(deleteResource('/document/'+id));
         // then reload
    }

    render() {
        let fields = ['id', 'filename', 'type', 'createdAt', 'updatedAt'];
        return <div className="container"><table className="table">
        <thead><tr>{ fields.map(f => <th key={f}>{f}</th>) }<th></th></tr></thead>
        <tbody>
        {this.props.data ? this.props.data.map(
            (row, i) => <tr key={i}>
                { fields.map(f => <td key={f}>{row[f]}</td>) }
                <td><Link activeClassName="active" className="nav-link" to={"/document/view/"+row.id} >View</Link></td>
                { /*<td><a href="#" type='button' value='Delete' onClick={this.submitDelete.bind(this, row.id)}  >Delete</a></td> */}
            </tr>)

        : null}
        </tbody>
        </table>
        </div>
    }
}



@pureRender
export class DocumentsPanel extends React.Component {
    static propTypes = {
        docList: PropTypes.shape({ documents: PropTypes.array.isRequired}).isRequired
    };
    render(){
        return <div className="panel panel-success" >
            <div className="panel-heading">
            <h3 className="panel-title">Documents</h3>
            </div>
            <div className="panel-body">
                <table className="table table-condensed" style={{marginBottom: 0}}>
                <thead><tr><th>Name</th><th>Date</th></tr></thead>
                <tbody>
                { this.props.docList.documents.slice(0, 5).map((d, i) => {
                    return <tr key={i}><td>{ d.filename }</td><td>{stringToDate(d.date)}</td></tr>
                }) }
                <tr><td colSpan="2" className="text-center">...</td></tr>
                </tbody>
                </table>
            </div>
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
                return stringToDate(value);
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
