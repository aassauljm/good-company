"use strict";
import React from 'react';
import pureRender from 'pure-render-decorator';
import { Input, ButtonInput } from 'react-bootstrap';


@pureRender
export default class Login extends React.Component {
    static propTypes = { error: React.PropTypes.object };
    submit(e) {
    	/*e.preventDefault();
        Actions.login({
            email: this.refs.email.getValue(),
            password: this.refs.password.getValue()
        });*/
    }
    render() {
        return <form ref="form" method="post" action="login" onSubmit={::this.submit}>
            { this.props.error ? <span className="Error">{this.props.error.message}</span> : null }
        	<Input type="text" ref="email" placeholder="Email" />
        	<Input type="password" ref="password" placeholder="Password"/>
        	<ButtonInput type='submit' value='Sign In' />
        </form>;
    }
}

