"use strict";
import React from 'react';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import {reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { fieldStyle, requiredFields, formProxyable, formProxy } from '../utils';
import Address from './forms/address'

@formProxyable
export class PersonForm extends React.Component {
    static propTypes = {
        fields: React.PropTypes.object
    };
    render() {
        const labelClassName = 'col-xs-3', wrapperClassName = 'col-xs-8';
        const { fields: {name, address } } = this.props;
        return <div className="panel panel-info">
            <div className="panel-heading">
                { this.props.title }
                <Button className="pull-right" bsSize='xs' aria-label="Close" onClick={this.props.remove}><span aria-hidden="true">&times;</span></Button>
            </div>
            <div className="panel-body">
                <Input type="text" {...name} label={STRINGS['name']} bsStyle={fieldStyle(name)} labelClassName={labelClassName} wrapperClassName={wrapperClassName}  />
                <Address type="text"  {...address}  label={STRINGS['address']} bsStyle={fieldStyle(address)} labelClassName={labelClassName} wrapperClassName={wrapperClassName}/>
                </div>
            </div>

    }
}

const DecoratedPersonForm = reduxForm({
  form: 'person',
  fields: ['name', 'address'],
  validate: requiredFields.bind(this, ['name', 'address']),
  destroyOnUnmount: false
})(PersonForm)


@formProxy
export default class PersonsForm extends React.Component {
    static propTypes = {
        keyList: React.PropTypes.array
    };

    getKey(d) {
        return  `${this.props.formKey}.${this.props.descriptor}.${d}`;
    }

    render(){
        return <div>
            { this.props.keyList.map((d, i) => {
            return <DecoratedPersonForm ref={d} key={d} formKey={this.getKey(d)}
                title={this.props.title}
                remove={() => this.props.remove(d)}
                register={this.register(d)} unregister={this.unregister(d)} />
            }) }
            </div>
    }
}
