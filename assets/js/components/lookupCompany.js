"use strict";
import React, {PropTypes} from 'react';
import { pureRender } from '../utils';
import Input from './forms/input';
import ButtonInput from './forms/buttonInput';
import ListGroup from './forms/listGroup';
import ListGroupItem from './forms/listGroupItem';
import { lookupCompany, importCompany, addNotification, requestResource } from '../actions';
import { connect } from 'react-redux';
import {reduxForm} from 'redux-form';
import { pushState, replaceState } from 'redux-router';


export class LookupCompanyForm extends React.Component {
    static propTypes = {
        fields: PropTypes.object.isRequired,
        submit: PropTypes.func.isRequired
    };
    submit(e){
        e.preventDefault();
        if(this.props.valid && this.refs.query.getValue()){
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


@connect(state => ({lookupCompany: state.lookupCompany, importCompany: state.importCompany}))
class LookupCompany extends React.Component {
    static propTypes = {
        lookupCompany: PropTypes.object.isRequired,
        importCompany: PropTypes.object.isRequired
    };
    submit(data){
        this.props.dispatch(lookupCompany(data))
    }
    importCompany(i){
        this.props.dispatch(importCompany(this.props.lookupCompany.list[i].companyNumber))
            .then((result) => {
                result.error ?
                    this.props.dispatch(addNotification({message: 'Could not import company', error: true})) :
                    this.props.dispatch(addNotification({message: 'Company Imported'}));
                this.props.dispatch(requestResource('companies', {refresh: true}));
            })
    }
    render() {
        return <div className="container">
            <DecoratedLookupCompanyForm submit={::this.submit} />
            { this.props._status === 'fetching' ? <span>Fetching</span> : null}
            { this.props._status === 'complete' && !this.props.lookupCompany.list.length ? <span>No Results</span> : null}
             <ListGroup>
                { this.props.lookupCompany.list.map((item, i) => {
                    return <ListGroupItem key={i} onClick={this.importCompany.bind(this, i)}>
                    { item.companyName }
                    { item.struckOff ? " (Struck Off)" : ''}
                    <div className="notes">
                        { (item.notes || []).map((note, i) => {
                            return <span>{note}</span>
                        }) }
                     </div>
                    </ListGroupItem>
                }) }
              </ListGroup>
            </div>
    }
}

// Wrap the component to inject dispatch and state into it
export default LookupCompany;