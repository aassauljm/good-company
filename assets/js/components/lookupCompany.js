"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import { pureRender, debounce } from '../utils';
import Input from './forms/input';
import ButtonInput from './forms/buttonInput';
import ListGroup from './forms/listGroup';
import ListGroupItem from './forms/listGroupItem';
import { lookupCompany } from '../actions';
import { connect } from 'react-redux';
import {reduxForm} from 'redux-form';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import silenceEvent from 'redux-form/lib/events/silenceEvent';


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
         return  <form ref="form" onSubmit={silenceEvent}>
            <Input type="text" ref="query" {...query} placeholder="Search company name or number" onChange={::this.handleChange}/>
           {  this.props.noResult && query.value ? <span>No Results</span> : null}
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
    render() {
        return <div>
            <DecoratedLookupCompanyForm submit={this._debouncedLookup} noResults={this.props.lookupCompany._status === 'complete' && !this.props.lookupCompany.list.length}/>
            { this.props.lookupCompany._status === 'fetching' ? <div className="loading"> <Glyphicon glyph="refresh" className="spin"/></div> : null}
             <ListGroup>
                { this.props.lookupCompany.list.map((item, i) => {
                    return <ListGroupItem key={i} onClick={() => this.props.next(item)}>
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