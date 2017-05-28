"use strict";
import React from 'react';
import PropTypes from 'prop-types'
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
export class LoginWithCatalex extends React.PureComponent {
    static propTypes = { login: PropTypes.object };

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
        let url = this.props.loginUrl;
        if(this.props.location.query && this.props.location.query.next){
            url += '?next='+encodeURIComponent(this.props.location.query.next);
        }
        return <div className="container-fluid page-top">
                <div className="container">
                    <div className="text-center">
                        <a href={url}>
                            <h5 style={{paddingTop: '30px'}}>Login with CataLex</h5>
                            <img style={{maxWidth: '100%', paddingBottom: '30px'}} src={'/images/logo-colour.png'} />
                        </a>
                    </div>
                </div>
            </div>
    }
}
