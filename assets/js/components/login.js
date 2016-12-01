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
                            <h5 style={{paddingTop: '30px'}}>Login with CataLex</h5>
                            <img style={{maxWidth: '100%', paddingBottom: '30px'}} src={'/images/logo-colour.png'} />
                        </a>
                    </div>
                </div>
            </div>
    }
}
