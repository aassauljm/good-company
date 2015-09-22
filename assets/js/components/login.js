"use strict";
import React from 'react';
import pureRender from 'pure-render-decorator';
import { Input, ButtonInput, Container } from 'react-bootstrap';
import Actions from '../actions';

@pureRender
export default class Login extends React.Component {
    static propTypes = { error: React.PropTypes.object };
    submit(e) {
    	e.preventDefault();
        Actions.login({
            identifier: this.refs.email.getValue(),
            password: this.refs.password.getValue()
        });
    }
    render() {
        console.log(this.props.error)
        return <div className="container">
            <form ref="form" method="post" action="login" target="auth/local" onSubmit={::this.submit}>
            { this.props.error ? <span className="Error">{this.props.error.message}</span> : null }
        	<Input type="text" ref="email" placeholder="Email" />
        	<Input type="password" ref="password" placeholder="Password"/>
        	<ButtonInput type='submit' value='Sign In' />
            </form>
            </div>
    }
}

