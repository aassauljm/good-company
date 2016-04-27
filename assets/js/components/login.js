"use strict";
import React from 'react';
import { pureRender } from '../utils';
import Input from './forms/input';
import ButtonInput from './forms/buttonInput';
import { requestLogin, addNotification } from '../actions';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { Link } from 'react-router';
import { routeActions } from 'react-router-redux'



export class LoginForm extends React.Component {
    submit(e){
        e.preventDefault();
        return this.props.submit(this.props.values);
    }

    render() {
        const { fields: {identifier, password} } = this.props;
         return  <div className="col-md-6 col-md-offset-3"> <form ref="form"  onSubmit={::this.submit}>
            { this.props.error ? <div className="alert alert-danger" role="alert">{this.props.error }</div> : null }
            <Input type="text" ref="identifier" {...identifier} label="Email" />
            <Input type="password" ref="password" {...password} label="Password"  />
            <div className="button-row">
                <button type='submit' className="btn btn-primary" ref="submit" onClick={::this.submit}>Sign In</button>
                <Link activeClassName="active" className="nav-link btn btn-info" to={'/signup'}>Sign Up</Link>
            </div>
            </form>
            </div>
    }
}

export const DecoratedLoginForm = reduxForm({
  form: 'login',
  fields: ['identifier', 'password']
})(LoginForm)

@connect(state => state.login)
@pureRender
class Login extends React.Component {
    static propTypes = { login: React.PropTypes.object };
    submit(data) {
        return this.props.dispatch(requestLogin(data))
    }
    componentDidMount() {
        this.nav()
    }
    componentDidUpdate() {
        this.nav()
    }
    nav() {
        if(this.props.loggedIn){
            this.props.dispatch(routeActions.replace((this.props.location.query || {}).next || '/companies'));
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