"use strict";
import React from 'react';
import {requestResource, updateResource, createResource} from '../actions';
import { pureRender, objectValues } from '../utils';
import { connect } from 'react-redux';
import { Input, ButtonInput, Container, Button } from 'react-bootstrap';
import { connectReduxForm } from 'redux-form';
import { initialize } from 'redux-form';
import { Link } from 'react-router';
import { fieldStyle } from '../utils';
import AuthenticatedComponent from  './authenticated';


@connect((state, ownProps) => state.resources['/document/'+ownProps.params.id ] || {data: {}})
@AuthenticatedComponent
@pureRender
export default class Account extends React.Component {

    key(){
        return this.props.params.id
    }

    componentDidMount(){
        if(this.props.route.edit){
            this.props.dispatch(requestResource('/document/'+this.key()));
        }
    }

    componentDidUpdate(){
        if(this.props.route.edit){
            this.props.dispatch(requestResource('/document/'+this.key()));
        }
    }

    validation(key){
        if(!this.props.data || !this.props.data.invalidAttributes || !this.props.data.invalidAttributes[key]){
            return;
        }
        if(this.props.data.invalidAttributes[key].length){
            return 'error';
        }
    }

    isOwnAccount(){
        return this.key() === this.props.id+'';
    }

    render() {
        return <div>
            <img src={"/api/document/get_document_preview/"+ this.key()}/>
        </div>
    }
}