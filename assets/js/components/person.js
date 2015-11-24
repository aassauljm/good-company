"use strict";
import React from 'react';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import {reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { fieldStyle, requiredFields, formFieldProps, formProxyable, formProxy } from '../utils';
import Panel from './panel';
import Address from './forms/address'


@formProxyable
@formFieldProps({
    labelClassName: 'col-xs-3',
    wrapperClassName: 'col-xs-9'
})
export class PersonForm extends React.Component {
    static propTypes = {
        fields: React.PropTypes.object
    };
    render() {
        return <Panel title={this.props.title} remove={this.props.remove} panelType="info">
                <Input type="text" {...this.formFieldProps('name')}  />
                <Address type="text"  {...this.formFieldProps('address')} />
                </Panel>
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
