"use strict";
import React from 'react';
import { pureRender } from '../utils';
import { Input, ButtonInput, Container } from 'react-bootstrap';
import { requestLogin } from '../actions';
import { connect } from 'react-redux';
import {connectReduxForm} from 'redux-form';
import { Link } from 'react-router';
import { pushState, replaceState } from 'redux-router';
import { fieldStyle } from '../utils';

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
            <Input type="text" ref="username" {...email} label="Username" />
            <Input type="password" ref="password" {...password} label="Password"  />
            <Input type="password" ref="repeatPassword" {...password} label="Repeat Password"  />
            <ButtonInput type='submit' value='Sign Up' />
        </form>
    }
}


@connect(state => state.login)
@pureRender
class Login extends React.Component {
    static propTypes = { login: React.PropTypes.object };
    submit(identifier, password) {
        this.props.dispatch(requestLogin(identifier, password))
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
            <LoginForm submit={::this.submit} />
            </div>
    }
}

// Wrap the component to inject dispatch and state into it
export default Login;