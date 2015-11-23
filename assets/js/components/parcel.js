"use strict";
import React from 'react';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import {reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { fieldStyle, requiredFields, formProxyable, formProxy } from '../utils';


@formProxyable
export class ParcelForm extends React.Component {
    static propTypes = {
        fields: React.PropTypes.object
    };

    renderShareClasses() {
        const labelClassName = 'col-md-3', wrapperClassName = 'col-md-8';
        const { fields: { shareClass} } = this.props;
        if(this.props.shareClasses.length){
            return <Input type="select"  {...shareClass}  label={STRINGS['shareClass']} bsStyle={fieldStyle(shareClass)} labelClassName={labelClassName} wrapperClassName={wrapperClassName}>
                { this.props.shareClasses.map((s, i) => {
                    return <option value={s.label} key={i}>{s.label}</option>
                })}
            </Input>
        }
    }

    render() {
        const labelClassName = 'col-md-3', wrapperClassName = 'col-md-8';
        const { fields: {amount } } = this.props;
        return <div className="panel panel-warning">
            <div className="panel-heading">
                { this.props.title }
                <Button className="pull-right" bsSize='xs' aria-label="Close" onClick={this.props.remove}><span aria-hidden="true">&times;</span></Button>
            </div>
            <div className="panel-body">
                <Input type="text" {...amount} label={STRINGS['amount']} bsStyle={fieldStyle(amount)} labelClassName={labelClassName} wrapperClassName={wrapperClassName}  />
                { this.renderShareClasses()}
                </div>
            </div>

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
