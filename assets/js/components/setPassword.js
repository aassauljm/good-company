"use strict";
import React, {PropTypes} from 'react';
import { pureRender } from '../utils';
import Input from './forms/input';
import ButtonInput from './forms/buttonInput';
import { setPassword } from '../actions';
import { connect } from 'react-redux';
import { reduxForm}  from 'redux-form';
import { fieldStyle } from '../utils';
import AuthenticatedComponent from  './authenticated';
import { pushState, replaceState } from 'redux-router';

function validatePasswordMatch(form){
    if(form.newPassword !== form.repeatPassword){
        return {newPassword: ['Passwords do not match'],
                repeatPassword: ['Passwords do not match'],
            };
    }
    return {};
}

export class PasswordForm extends React.Component {
    static propTypes = {
        submit: PropTypes.func.isRequired
    }

    submit(e){
        e.preventDefault();
        console.log("SUBMIT")
        this.props.submit({
            oldPassword: this.refs.oldPassword.getValue(),
            newPassword: this.refs.newPassword.getValue()
       });
    }

    render() {
        const { fields: {oldPassword, newPassword, repeatPassword} } = this.props;
         return  <form onSubmit={::this.submit}>
            <Input type="password" ref="oldPassword" {...oldPassword} bsStyle={fieldStyle(this.props.fields.oldPassword)} label="Old Password" />
            <Input type="password" ref="newPassword" {...newPassword} bsStyle={fieldStyle(this.props.fields.newPassword)} label="New Password"  />
            <Input type="password" ref="repeatPassword" {...repeatPassword} bsStyle={fieldStyle(this.props.fields.repeatPassword)} label="Repeat Password"  />
            <ButtonInput type='submit' value='Update' ref="submit" onClick={::this.submit}/>
        </form>
    }
}


@reduxForm({
  form: 'setPassword',
  fields: ['oldPassword', 'newPassword', 'repeatPassword'],
  validate: validatePasswordMatch
})
@AuthenticatedComponent
class SetPassword extends React.Component {
    static propTypes = {
        dispatch: React.PropTypes.func.isRequired
    }

    submit(data) {
        this.props.touchAll();
        if(this.props.valid){
            this.props.dispatch(setPassword(data));
        }
    }

    render() {
        return <div>
            <PasswordForm submit={::this.submit} fields={this.props.fields}/>
            </div>
    }
}

// Wrap the component to inject dispatch and state into it
export default SetPassword;