"use strict";
import React from 'react';
import { pureRender } from '../utils';
import Input from './forms/input';
import ButtonInput from './forms/buttonInput';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import { requestLogin } from '../actions';
import { connect } from 'react-redux';
import {reduxForm} from 'redux-form';
import { Link } from 'react-router';
import { pushState, replaceState } from 'redux-router';



export class LoginForm extends React.Component {
    submit(e){
        e.preventDefault();
        if(this.props.valid){
            this.props.submit({
                identifier: this.refs.email.getValue(),
                password: this.refs.password.getValue()
           });
        }
    }

    render() {
        const { fields: {email, password} } = this.props;
         return  <div className="col-md-6 col-md-offset-3"> <form ref="form" method="post" action="login" target="auth/local" onSubmit={::this.submit}>
            { this.props.error ?    <div className="alert alert-danger" role="alert">{this.props.error }</div> : null }
            <Input type="text" ref="email" {...email} label="Email" />
            <Input type="password" ref="password" {...password} label="Password"  />
            </form>
            <ButtonToolbar className="text-center">
                <button type='submit' className="btn btn-primary" ref="submit" onClick={::this.submit}>Sign In</button>
                <Link activeClassName="active" className="nav-link btn btn-info" to={'/signup'}>Sign Up</Link>
            </ButtonToolbar>
            </div>
    }
}

export const DecoratedLoginForm = reduxForm({
  form: 'login',
  fields: ['email', 'password']
})(LoginForm)

@connect(state => state.login)
@pureRender
class Login extends React.Component {
    static propTypes = { login: React.PropTypes.object };
    submit(data) {
        this.props.dispatch(requestLogin(data))
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
            <DecoratedLoginForm submit={::this.submit} />
            </div>
    }
}

// Wrap the component to inject dispatch and state into it
export default Login;