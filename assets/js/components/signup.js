"use strict";
import React from 'react';
import { pureRender } from '../utils';
import Input from './forms/input';
import ButtonInput from './forms/buttonInput';
import { requestLogin, addNotification } from '../actions';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { push } from 'react-router-redux'
import { routeActions } from 'react-router-redux'
import { fieldStyle, fieldHelp, objectValues, validateWithSchema } from '../utils';
import { createResource, validateUser } from '../actions';
import Promise from 'bluebird'
import validator from 'validator'

var signUpSchema = {
    email: [{
            test: (value) => validator.isEmail(value || ''),
            message: 'A valid email is required'
        }],
    username: [
        {test: (value) => value,
            message: 'A username is required'
        }, {test: (value) => validator.isLength(value || '', 5),
            message: 'Username is too short'
        },
    ],
    password: [
        {test: (value) => value,
            message: 'A password is required'
        }, {test: (value) => validator.isLength(value || '', 8),
            message: 'Password is too short'
        }],
    repeatPassword: [
        {test: (value) => value,
            message: 'Please repeat password'
        }, {test: (value, form) => value === form.password,
            message: 'Passwords do not match'
        }],
};

function asyncValidate(form, dispatch){
    return dispatch(validateUser(form))
        .catch(function(error){
            return Promise.reject({
                email: [error.message],
                username: [error.message]
            })
        })

}

@reduxForm({
  form: 'signup',
  fields: ['email', 'username', 'password', 'repeatPassword'],
  validate: validateWithSchema(signUpSchema),
  asyncValidate,
  asyncBlurFields: ['email', 'username']
})
export default class SignUpForm extends React.Component {
    submit(e){
        e.preventDefault();
        this.props.touchAll();
        if(this.props.valid){
            this.props.submit(this.props.values);
        }
    }
    render() {
        const { fields: {email, username, password, repeatPassword} } = this.props;
         return  <div className="col-md-6 col-md-offset-3">
         <form ref="form"  onSubmit={::this.submit}>
            <Input type="text" ref="email" {...email} bsStyle={fieldStyle(email)}
            label="Email" hasFeedback help={fieldHelp(email)} />
            <Input type="text" ref="username" {...username} bsStyle={fieldStyle(this.props.fields.username)}
            label="Username" hasFeedback help={fieldHelp(username)} />
            <Input type="password" ref="password" {...password} bsStyle={fieldStyle(this.props.fields.password)}
            label="Password"  hasFeedback help={fieldHelp(password)} />
            <Input type="password" ref="repeatPassword" {...repeatPassword} bsStyle={fieldStyle(this.props.fields.repeatPassword)}
            label="Repeat Password" hasFeedback help={fieldHelp(repeatPassword)}  />
            <ButtonInput type='submit' bsStyle="primary" value='Sign Up' />
            </form></div>
    }
}


@connect(state => state.login)
class Signup extends React.Component {

    static propTypes = { login: React.PropTypes.object };

    submit(data) {
        return this.props.dispatch(createResource('/user/signup', data, {form: 'signup'}))
            .then((result) => {
                 this.props.dispatch(push('/'))
             })
            .catch(err => {
                this.props.dispatch(addNotification({error: true, message: err.message}));
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
            this.props.dispatch(push('/'));
        }
    }
    render() {
        return <div className="container-fluid page-top">
            <div className="container">
            <SignUpForm submit={::this.submit} />
            </div>
            </div>
    }
}

// Wrap the component to inject dispatch and state into it
export default Signup;