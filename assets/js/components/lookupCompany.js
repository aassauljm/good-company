"use strict";
import React, {PropTypes} from 'react';
import { pureRender, debounce } from '../utils';
import Input from './forms/input';
import ButtonInput from './forms/buttonInput';
import ListGroup from './forms/listGroup';
import ListGroupItem from './forms/listGroupItem';
import { lookupCompany, importCompany, addNotification, requestResource } from '../actions';
import { connect } from 'react-redux';
import {reduxForm} from 'redux-form';
import { pushState, replaceState } from 'redux-router';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';

export class LookupCompanyForm extends React.Component {
    static propTypes = {
        fields: PropTypes.object.isRequired,
        submit: PropTypes.func.isRequired
    };

    lookup(val){
        if(this.props.valid && val){
            this.props.submit(val);
        }
    }

    handleChange() {
        const val = this.refs.query.getValue()
        this.props.fields.query.onChange(val);
        this.lookup(val)
    }

    render() {
        const { fields: {query} } = this.props;
         return  <form ref="form">
            <Input type="text" ref="query" {...query} placeholder="Search company name or number" onChange={::this.handleChange}/>
        </form>
    }
}

export const DecoratedLookupCompanyForm = reduxForm({
  form: 'lookupCompany',
  fields: ['query']
})(LookupCompanyForm);


@connect(state => ({lookupCompany: state.lookupCompany}))
class LookupCompany extends React.Component {
    static propTypes = {
        lookupCompany: PropTypes.object.isRequired
    };
    constructor() {
        super();
        this._debouncedLookup = debounce(::this.lookup, 300);
    }
    lookup(data) {
        this.props.dispatch(lookupCompany(data))
    }

    importCompany(i) {
        this.props.dispatch(importCompany(this.props.lookupCompany.list[i].companyNumber))
            .then((result) => {
                result.error ?
                    this.props.dispatch(addNotification({message: 'Could not import company', error: true})) :
                    this.props.dispatch(addNotification({message: 'Company Imported'}));
                this.props.dispatch(requestResource('companies', {refresh: true}));
            })
    }
    render() {
        return <div>
            <DecoratedLookupCompanyForm submit={this._debouncedLookup} />
            { this.props.lookupCompany._status === 'fetching' ? <div className="loading"> <Glyphicon glyph="refresh" className="spin"/></div> : null}
            { this.props.lookupCompany._status === 'complete' && !this.props.lookupCompany.list.length ? <span>No Results</span> : null}
             <ListGroup>
                { this.props.lookupCompany.list.map((item, i) => {
                    return <ListGroupItem key={i} onClick={this.importCompany.bind(this, i)}>
                    { item.companyName }
                    { item.struckOff ? " (Struck Off)" : ''}
                    <div className="notes">
                        { (item.notes || []).map((note, i) => {
                            return <span key={i}>{note}</span>
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