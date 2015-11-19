"use strict";
import React from 'react';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import {reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { fieldStyle, requiredFields } from '../utils';
import Address from './forms/address'

export class PersonForm extends React.Component {
    static propTypes = {
        fields: React.PropTypes.object
    };

    componentWillMount(nextProps) {
        this.props.register(this);
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

export default class PersonsForm extends React.Component {
    static propTypes = {
        keyList: React.PropTypes.array
    };


    REFHACK = {};

    touchAll() {
        this.props.keyList.map((d, i) => {
            this.REFHACK[d].props.touchAll();
        });
    }

    isValid() {
        return  this.props.keyList.map((d, i) => {
            return this.REFHACK[d].props.valid;
        }).every(x => x)
    }

    getKey(d) {
        return  `${this.props.formKey}.person.${d}`;
    }

    render(){
        return <div>
            { this.props.keyList.map((d, i) => {
            return <DecoratedPersonForm ref={d} key={d} formKey={this.getKey(d)}
                title={this.props.title}
                remove={() => this.props.remove(d)}
                register={(child) => this.REFHACK[d] = child} />
            }) }
            </div>
    }
}
