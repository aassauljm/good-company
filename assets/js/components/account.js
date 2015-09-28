"use strict";
import React from 'react';
import {requestResource, updateResource, createResource} from '../actions';
import pureRender from 'pure-render-decorator';
import { connect } from 'react-redux';
import { Input, ButtonInput, Container, Button } from 'react-bootstrap';

function* objectValues(obj) {
  for (let prop of Object.keys(obj)) {
    yield obj[prop];
  }
}


@pureRender
@connect((state, ownProps) => state.resources[ownProps.edit ? 'user/'+ownProps.params.id : 'user'] || {data: {}})
export default class Account extends React.Component {
    key(){
        return this.props.params.id
    }

    componentDidMount(){
        if(this.props.edit){
            this.props.dispatch(requestResource('user/'+this.key()));
        }
    }

    componentDidUpdate(){
        if(this.props.edit){
            this.props.dispatch(requestResource('user/'+this.key()));
        }
    }

    submit(e) {
        e.preventDefault();
        let data = {
            email: this.refs.email.getValue(),
            username: this.refs.username.getValue(),
        }
        if(this.props.edit){
            this.props.dispatch(updateResource('user/'+this.key(), data));
        }
        else{
            this.props.dispatch(createResource('user', data));
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

    errors(){
        if(!this.props.data || !this.props.data.invalidAttributes){
            return;
        }
        let errors = [], i = 0;
        for(let value of objectValues(this.props.data.invalidAttributes)){
            errors.push(...value.map((m) => (
                <div className="alert alert-danger" role="alert" key={i++}>{m.message}</div>
                )
            ));
        }
        return errors;
    }

    render() {
        let data = this.props.data || {};
        return <div><form onSubmit={::this.submit}>
            { this.errors() }
            <Input type="text" ref="email" defaultValue={data.email} label="Email" bsStyle={this.validation('email')} />
            <Input type="text" ref="username" defaultValue={data.username} label="User name" bsStyle={this.validation('username')} />
            <ButtonInput type='submit' value={this.props.edit ? 'Update' : 'Create' } />
        </form>
        </div>
    }
}

//success, warning or error. Add hasFeedback