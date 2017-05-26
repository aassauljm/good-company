"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import { formFieldProps, pureRender } from '../utils';
import Input from './forms/input';
import ButtonInput from './forms/buttonInput';
import { setPassword, addNotification } from '../actions';
import { connect } from 'react-redux';
import { reduxForm}  from 'redux-form';
import { fieldStyle } from '../utils';

const fields = ['oldPassword', 'newPassword', 'repeatPassword'];


function validatePasswordMatch(form){
    if(form.newPassword !== form.repeatPassword){
        return {newPassword: ['Passwords do not match'],
                repeatPassword: ['Passwords do not match'],
            };
    }
    return {};
}


@formFieldProps()
export class PasswordForm extends React.Component {
    static propTypes = {
        submit: PropTypes.func.isRequired
    }

    submit(e){
        e.preventDefault();
        this.props.submit({
            oldPassword: this.refs.oldPassword.getValue(),
            newPassword: this.refs.newPassword.getValue()
       });
    }

    render() {
        const { fields: {oldPassword, newPassword, repeatPassword} } = this.props;
         return  <form onSubmit={::this.submit}>
            <Input type="password" ref="oldPassword" {...this.formFieldProps('oldPassword')} label="Old Password" />
            <Input type="password" ref="newPassword" {...this.formFieldProps('newPassword')} label="New Password"  />
            <Input type="password" ref="repeatPassword" {...this.formFieldProps('repeatPassword')} label="Repeat Password"  />
            <ButtonInput type='submit' value='Update' ref="submit" onClick={::this.submit}/>
        </form>
    }
}


@reduxForm({
  form: 'setPassword',
  fields: fields,
  validate: validatePasswordMatch
})
class SetPassword extends React.Component {
    static propTypes = {
        dispatch: React.PropTypes.func.isRequired
    }

    submit(data) {
        this.props.touchAll();

        return new Promise((resolve, reject) => {
            this.props.dispatch(setPassword(data))
            .then((result) => {
                 this.props.dispatch(addNotification({message: 'Password updated.'}))
                 resolve();
             })
            .catch(err => {
                const errors = fields.reduce((acc, key) => {
                    if(err[key]) acc[key] = [err[key].message]
                    return acc;
                }, {})

                reject({...errors,  _error: 'Set password failed.'})
            });
        });

    }

    render() {
        return <div className="container">
            <div className="row">
            <div className="col-md-6 col-md-offset-3">
            <PasswordForm submit={::this.submit} fields={this.props.fields}/>
            </div>
            </div>
            </div>
    }
}

// Wrap the component to inject dispatch and state into it
export default SetPassword;