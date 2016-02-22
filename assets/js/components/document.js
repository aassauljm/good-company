"use strict";
import React from 'react';
import {requestResource, updateResource, createResource} from '../actions';
import { pureRender, objectValues } from '../utils';
import { connect } from 'react-redux';
import { initialize } from 'redux-form';
import { Link } from 'react-router';
import { fieldStyle } from '../utils';
import AuthenticatedComponent from  './authenticated';


@connect((state, ownProps) => state.resources['/document/'+ownProps.params.id ] || {data: {}})
@AuthenticatedComponent
export default class Account extends React.Component {

    key(){
        return this.props.params.id
    }

    componentDidMount(){
        this.props.dispatch(requestResource('/document/'+this.key()));
    }

    componentDidUpdate(){
        this.props.dispatch(requestResource('/document/'+this.key()));
    }
    isOwnAccount(){
        return this.key() === this.props.id+'';
    }

    render() {
        const data = this.props.data || {};
        return <div className="container">
            <div className="col-md-6">
                <img src={"/api/document/get_document_preview/"+ this.key()}/>
            </div>
             <div className="col-md-6">
             <dl>
                  <dt>ID</dt>
                  <dd>{data.id}</dd>
                  <dt>Filename</dt>
                  <dd>{data.filename}</dd>
                  <dt>Type</dt>
                  <dd>{data.type}</dd>
                  <dt>Date Created</dt>
                  <dd>{new Date(data.createdAt).toDateString()}</dd>
                </dl>
            </div>
        </div>
    }
}