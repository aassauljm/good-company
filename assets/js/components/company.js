"use strict";
import React from 'react';
import {requestResource, deleteResource} from '../actions';
import { pureRender } from '../utils';
import { connect } from 'react-redux';
import ButtonInput from './forms/buttonInput';
import LookupCompany from  './lookupCompany';
import AuthenticatedComponent from  './authenticated';
import { Link } from 'react-router';


@connect((state, ownProps) => state.resources['/company/'+ownProps.params.id +'/get_info' ]|| {data: {}})
@AuthenticatedComponent
export default class Company extends React.Component {

    key(){
        return this.props.params.id
    }

    componentDidMount(){
        this.props.dispatch(requestResource('/company/'+this.key()+'/get_info'));
    }

    componentDidUpdate(){
        this.props.dispatch(requestResource('/company/'+this.key()+'/get_info'));
    }

    renderData(){
        if(!this.props.data || !this.props.data.currentCompanyState){
            return
                <div className="loading"></div>
        }
        const current = this.props.data.currentCompanyState;
        return <div>
                <div className="jumbotron">
                    <h1>{current.companyName}</h1>
                    <h5>#{current.companyNumber}, {current.companyStatus}</h5>
                </div>
                <dl className="dl-horizontal">
                    <dt className="col-sm-3">NZ Business Number</dt>
                    <dd className="col-sm-9">{current.nzbn ||  'Unknown'}</dd>
                    <dt className="col-sm-3">Incorporation Date</dt>
                    <dd className="col-sm-9">{new Date(current.incorporationDate).toDateString()}</dd>
                    <dt className="col-sm-3">Total Shares</dt>
                    <dd className="col-sm-9">{current.totalShares}</dd>
                </dl>
            </div>
    }

    render(){
        return <div>
            { this.renderData() }
        </div>
    }
}

