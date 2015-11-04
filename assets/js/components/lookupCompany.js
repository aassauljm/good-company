"use strict";
import React from 'react';
import { pureRender } from '../utils';
import Input from './forms/input';
import ButtonInput from './forms/buttonInput';
import { lookupCompany } from '../actions';
import { connect } from 'react-redux';
import {reduxForm} from 'redux-form';
import { pushState, replaceState } from 'redux-router';


export class LookupCompanyForm extends React.Component {
    submit(e){
        e.preventDefault();
        if(this.props.valid){
            this.props.submit(this.refs.query.getValue());
        }
    }
    render() {
        const { fields: {query} } = this.props;
         return  <form ref="form" onSubmit={::this.submit}>
            <Input type="text" ref="query" {...query} label="Search" />
            <ButtonInput type='submit' value='Search' ref="submit" onClick={::this.submit} />
        </form>
    }
}

export const DecoratedLookupCompanyForm = reduxForm({
  form: 'lookupCompany',
  fields: ['query']
})(LookupCompanyForm)

@connect(state => state.login)
@pureRender
class LookupCompany extends React.Component {
    static propTypes = { login: React.PropTypes.object };
    submit(data) {
        this.props.dispatch(lookupCompany(data))
    }
    render() {
        return <div className="container">
            <DecoratedLookupCompanyForm submit={::this.submit} />
            </div>
    }
}

// Wrap the component to inject dispatch and state into it
export default Login;