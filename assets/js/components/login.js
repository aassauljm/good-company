"use strict";
import React from 'react';
import { pureRender } from '../utils';
import { Input, ButtonInput, Container } from 'react-bootstrap';
import { requestLogin } from '../actions';
import { connect } from 'react-redux';
import {connectReduxForm} from 'redux-form';

@connectReduxForm({
  form: 'login',
  fields: ['email', 'password']
})
export default class LoginForm extends React.Component {
    submit(e){
        e.preventDefault();
        this.props.submit({
            identifier: this.refs.email.getValue(),
            password: this.refs.password.getValue()
       });
    }

    render() {
        const { fields: {email, password} } = this.props;
         return  <form ref="form" method="post" action="login" target="auth/local" onSubmit={::this.submit}>
            { this.props.error ?    <div className="alert alert-danger" role="alert">{this.props.error }</div> : null }
            <Input type="text" ref="email" {...email} label="Email" />
            <Input type="password" ref="password" {...password} label="Password"  />
            <ButtonInput type='submit' value='Sign In' />
        </form>
    }
}

@pureRender
@connect(state => state.login)
class Login extends React.Component {
    static propTypes = { login: React.PropTypes.object };
    submit(identifier, password) {
        this.props.dispatch(requestLogin(identifier, password))
    }
    render() {
        return <div className="container">
            <LoginForm submit={::this.submit} />
            </div>
    }
}

// Wrap the component to inject dispatch and state into it
export default Login;