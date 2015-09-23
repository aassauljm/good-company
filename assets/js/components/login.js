"use strict";
import React from 'react';
import pureRender from 'pure-render-decorator';
import { Input, ButtonInput, Container } from 'react-bootstrap';
import { requestLogin } from '../actions';
import { connect } from 'react-redux';



@pureRender
@connect(state => state.login)
class Login extends React.Component {
    static propTypes = { login: React.PropTypes.object };
    submit(e) {
    	e.preventDefault();
        this.props.dispatch(requestLogin({
            identifier: this.refs.email.getValue(),
            password: this.refs.password.getValue()
       }));
    }
    render() {
        return <div className="container">
            <form ref="form" method="post" action="login" target="auth/local" onSubmit={::this.submit}>
            { this.props.loginError ? <span className="Error">{this.props.loginError }</span> : null }
        	<Input type="text" ref="email" placeholder="Email" />
        	<Input type="password" ref="password" placeholder="Password"/>
        	<ButtonInput type='submit' value='Sign In' />
            </form>
            </div>
    }
}

// Wrap the component to inject dispatch and state into it
export default Login