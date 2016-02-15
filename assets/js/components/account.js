"use strict";
import React from 'react';
import {requestResource, updateResource, createResource, addNotification} from '../actions';
import { pureRender, objectValues } from '../utils';
import { connect } from 'react-redux';
import Input from './forms/input';
import ButtonInput from './forms/buttonInput';
import { reduxForm } from 'redux-form';
import { reset} from 'redux-form';
import { Link } from 'react-router';
import { fieldStyle } from '../utils';
import AuthenticatedComponent from  './authenticated';


@reduxForm({
  form: 'account',
  fields: ['email', 'username'],
  //validate: fieldExistence
})
export default class AccountForm extends React.Component {
    submit(e){
        e.preventDefault();
        const data = {
            email: this.refs.email.getValue(),
            username: this.refs.username.getValue(),
        }
        if(this.props.valid){
            this.props.submit(data);
        }
        else{
            this.props.touchAll();
        }
    }

    componentWillUnmount(){
        this.props.dispatch(reset('account'));
    }

    errors(){
        const errors = [];
        let i = 0;
        for(let field of objectValues(this.props.fields)){
            errors.push(...(field.error || []).map((m) => (
                <div className="alert alert-danger" role="alert" key={i++}>{m}</div>
                )
            ));
        }
        return errors;
    }

    render() {
        const { fields: {email, username} } = this.props;
         return <form onSubmit={::this.submit}>
            <Input type="text" ref="email" {...email}
                bsStyle={fieldStyle(this.props.fields.email)} label="Email" />
            <Input type="text" ref="username" {...username} label="User name"
                bsStyle={fieldStyle(this.props.fields.username)}  />
            <ButtonInput type='submit' value={this.props.edit ? 'Update' : 'Create' } />
            { this.errors() }
        </form>
    }
}

// DANGER, do other accounts
//@connect((state, ownProps) => {return {state.resources[ownProps.route.edit ? '/user/'+ownProps.params.id : '/user'] || {data: {}})
@connect((state) => state.userInfo)
@AuthenticatedComponent
export default class Account extends React.Component {

    key(){
        return this.props.params.id
    }

    componentDidMount(){
        if(this.props.route.edit){
            this.props.dispatch(requestResource('/user/'+this.key(), {form: 'account'}));
        }
    }

    componentDidUpdate(){
        if(this.props.route.edit){
            this.props.dispatch(requestResource('/user/'+this.key(), {form: 'account'}));
        }
    }

    submit(data) {
        if(this.props.route.edit){
            this.props.dispatch(updateResource('/user/'+this.key(), data, {form: 'account'}))
                .then(() => this.props.dispatch(addNotification({message: 'Account Updated'})))
        }
        else{
            this.props.dispatch(createResource('/user', data, 'account'))
                .then(() => this.props.dispatch(addNotification({message: 'Account Created'})))
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
        return <div className="container">
            <div className="col-md-6 col-md-offset-3">
            <AccountForm submit={::this.submit} edit={this.props.route.edit} />
            { this.isOwnAccount() ? <Link activeClassName="active" className="nav-link" to={"/user/set_password"}>Set Password</Link> : null }
            </div>
        </div>
    }
}

//success, warning or error. Add hasFeedback