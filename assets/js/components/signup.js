"use strict";
import React from 'react';
import { pureRender } from '../utils';
import Input from './forms/input';
import ButtonInput from './forms/buttonInput';
import { requestLogin } from '../actions';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { Link } from 'react-router';
import { pushState, replaceState } from 'redux-router';
import { fieldStyle, objectValues } from '../utils';
import { createResource, validateUser } from '../actions';
import Promise from 'bluebird'

function signUpValidate(form){
    const error = {};
    if(!form.email){
        error.email = ['Email required'];
    }
    if(!form.username){
        error.username= ['Username required'];
    }
    if(!form.password){
        error.password = ['Password required'];
    }
    if(!form.repeatPassword){
        error.repeatPassword = ['Password required'];
    }
    return error;
}

function asyncValidate(form, dispatch){
    return dispatch(validateUser(form))
        .then(function(result){
            if(result.error){

                return Promise.reject({
                    email: [result.response.message],
                    username: [result.response.message]
                })
            }
            return {};
        })

}


@reduxForm({
  form: 'signup',
  fields: ['email', 'username', 'password', 'repeatPassword'],
  validate: signUpValidate,
  asyncValidate,
  asyncBlurFields: ['email', 'username']
})
export default class SignUpForm extends React.Component {
    submit(e){
        e.preventDefault();
        this.props.touchAll();
        if(this.props.valid){
            this.props.submit({
                email: this.refs.email.getValue(),
                username: this.refs.username.getValue(),
                password: this.refs.password.getValue()
           });
        }
    }
    render() {
        const { fields: {email, username, password, repeatPassword} } = this.props;

         return  <div className="col-md-6 col-md-offset-3"><form ref="form" method="post" action="login" target="auth/local" onSubmit={::this.submit}>
            <Input type="text" ref="email" {...email} bsStyle={fieldStyle(this.props.fields.email)} label="Email" hasFeedback />
            <Input type="text" ref="username" {...username} bsStyle={fieldStyle(this.props.fields.username)} label="Username" hasFeedback />
            <Input type="password" ref="password" {...password} bsStyle={fieldStyle(this.props.fields.password)}label="Password"  hasFeedback />
            <Input type="password" ref="repeatPassword" {...repeatPassword} bsStyle={fieldStyle(this.props.fields.repeatPassword)} label="Repeat Password" hasFeedback  />
            <ButtonInput type='submit' value='Sign Up' />
            </form></div>
    }
}


@connect(state => state.login)
class Signup extends React.Component {
    static propTypes = { login: React.PropTypes.object };
    submit(data) {
        this.props.dispatch(createResource('/user/signup', data, {form: 'signup'}))
    }
    componentDidMount() {
        this.nav()
    }
    componentDidUpdate() {
        this.nav()
    }
    nav() {
        if(this.props.loggedIn){
            this.props.dispatch(pushState(null, '/'));
        }
    }
    render() {
        return <div className="container">
            <SignUpForm submit={::this.submit} />
            </div>
    }
}

// Wrap the component to inject dispatch and state into it
export default Signup;