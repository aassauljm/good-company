"use strict";
import React from 'react';
import {requestResource, updateResource, createResource, addNotification, requestUserInfo, showLoading, endLoading } from '../actions';
import { pureRender, objectValues } from '../utils';
import { connect } from 'react-redux';
import Input from './forms/input';
import ButtonInput from './forms/buttonInput';
import { reduxForm } from 'redux-form';
import { reset} from 'redux-form';
import { Link } from 'react-router';
import { fieldStyle } from '../utils';
import LawBrowserContainer from './lawBrowserContainer'
import Widget from './widget';


@reduxForm({
  form: 'accountSettings',
  fields: ['importEmail', 'transactionEmail'],
})
export class AccountSettingsForm extends React.Component {

    render() {
        const { fields: {importEmail, transactionEmail},  handleSubmit } = this.props;
         return <form onSubmit={ handleSubmit}>
            <Input type="checkbox" {...importEmail} label="Receive Bulk Import Emails" />
            <Input type="checkbox" {...transactionEmail} label="Receive Bulk Setup Emails" />
            <div className="button-row">
                <ButtonInput type='submit' bsStyle="primary">Update</ButtonInput>
            </div>
        </form>
    }
}

@connect(state => ({
    userInfo: state.userInfo
}), {
    showLoading: () => showLoading(),
    endLoading: () => endLoading(),
    update: (data) => updateResource('/account_settings', {settings:data}),
    addNotification: (...args) => addNotification(...args),
    refreshUserInfo: () => requestUserInfo({refresh: true})
})
export default class AccountSettings extends React.Component {

    handleSubmit(values) {
        this.props.showLoading();
        this.props.update(values)
            .then((r) => {
                this.props.addNotification({message: r.response.message})
                return this.props.refreshUserInfo();
            })
            .then(() => {
                this.props.endLoading();
            })
            .catch(() => {
                this.props.endLoading();
            })

    }

    render() {
        const state = this.props.userInfo.settings || {};
        if(state.importEmail !== false){
            state.importEmail = true;
        }
        if(state.transactionEmail !== false){
            state.transactionEmail = true;
        }
        return <LawBrowserContainer>
            <Widget title="Account Settings">
                 <AccountSettingsForm initialValues={state } onSubmit={::this.handleSubmit}/>
            </Widget>
            </LawBrowserContainer>
    }
}