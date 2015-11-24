"use strict";
import React from 'react';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import {reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { fieldStyle, requiredFields, formFieldProps, formProxyable, formProxy } from '../utils';
import Panel from './panel';


@formProxyable
@formFieldProps({
    labelClassName: 'col-md-3',
    wrapperClassName: 'col-md-9'
})
export class ParcelForm extends React.Component {
    static propTypes = {
        fields: React.PropTypes.object
    };

    renderShareClasses() {
        if(this.props.shareClasses.length){
            return <Input type="select"  {...this.formFieldProps('shareClass')}  >
                { this.props.shareClasses.map((s, i) => {
                    return <option value={s.label} key={i}>{s.label}</option>
                })}
            </Input>
        }
    }

    render() {
        return <Panel title={this.props.title} remove={this.props.remove} panelType="warning">
                <Input type="text" {...this.formFieldProps('amount')}  />
                { this.renderShareClasses()}
                </Panel>

    }
}

const DecoratedParcelForm = reduxForm({
  form: 'parcel',
  fields: ['amount', 'shareClass'],
  validate: requiredFields.bind(this, ['amount']),
  destroyOnUnmount: false
})(ParcelForm)


@formProxy
export default class ParcelsForm extends React.Component {
    static propTypes = {
        keyList: React.PropTypes.array,
        shareClasses: React.PropTypes.array
    };

    getKey(d) {
        return  `${this.props.formKey}.parcel.${d}`;
    }
    render(){
        return <div>
            { this.props.keyList.map((d, i) => {
            return <DecoratedParcelForm ref={d} key={d} formKey={this.getKey(d)}
                title={this.props.title}
                shareClasses={this.props.shareClasses}
                remove={() => this.props.remove(d)}
                register={this.register(d)} unregister={this.unregister(d)} />
            }) }
            </div>
    }
}
