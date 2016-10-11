"use strict";
import React from 'react';
import { pureRender } from '../utils';
import Input from './forms/input';
import ButtonInput from './forms/buttonInput';
import { requestLogin, addNotification } from '../actions';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { Link } from 'react-router';
import { replace } from 'react-router-redux'



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
            .catch(err => {
                this.props.dispatch(addNotification({error: true, message: 'Invalid Credentials'}));
            });
    }
    componentDidMount() {
        this.nav()
    }

    componentDidUpdate() {
        this.nav()
    }
    nav() {
        if(this.props.loggedIn){
            this.props.dispatch(replace((this.props.location.query || {}).next || '/'));
        }
    }
    render() {
        return <div className="container-fluid page-top">
                <div className="container">
                    <DecoratedLoginForm submit={::this.submit} />
                </div>
            </div>
    }
}

@connect(state => state.login)
@pureRender
export class LoginWithCatalex extends React.Component {
    static propTypes = { login: React.PropTypes.object };
    componentDidMount() {
        this.nav()
    }
    componentDidUpdate() {
        this.nav()
    }
    nav() {
        if(this.props.loggedIn){
            this.props.dispatch(replace((this.props.location.query || {}).next || '/'));
        }
    }
    render() {
        return <div className="container-fluid page-top">
                <div className="container">
                    <div className="text-center">
                        <a href={this.props.loginUrl}>
                            <h5>Login with CataLex</h5>
                            <img style={{maxWidth: '100%'}}src={'/images/logo-colour.png'} />
                        </a>
                    </div>
                </div>
            </div>
    }
}

export default Login;