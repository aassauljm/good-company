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
import { createResource } from '../actions';

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

@reduxForm({
  form: 'signup',
  fields: ['email', 'username', 'password', 'repeatPassword'],
  validate: signUpValidate
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
        const { fields: {email, username, password, repeatPassword} } = this.props;
         return  <form ref="form" method="post" action="login" target="auth/local" onSubmit={::this.submit}>
            { this.errors() }
            <Input type="text" ref="email" {...email} bsStyle={fieldStyle(this.props.fields.email)} label="Email" />
            <Input type="text" ref="username" {...username} bsStyle={fieldStyle(this.props.fields.username)} label="Username" />
            <Input type="password" ref="password" {...password} bsStyle={fieldStyle(this.props.fields.password)}label="Password"  />
            <Input type="password" ref="repeatPassword" {...repeatPassword} bsStyle={fieldStyle(this.props.fields.repeatPassword)} label="Repeat Password"  />
            <ButtonInput type='submit' value='Sign Up' />
        </form>
    }
}


@connect(state => state.login)
class Signup extends React.Component {
    static propTypes = { login: React.PropTypes.object };
    submit(data) {
        this.props.dispatch(createResource('/user/signup', data, 'signup'))
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