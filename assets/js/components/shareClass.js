"use strict";
import React from 'react';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import {reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { fieldStyle, requiredFields, formProxyable, formProxy } from '../utils';


@formProxyable
export class ShareClassForm extends React.Component {
    static propTypes = {
        fields: React.PropTypes.object
    };
    render() {
        const { fields: {label} } = this.props;
        return <div className="col-md-6 col-md-offset-3">
            <Input type="text" {...label} label={STRINGS['label']}
                bsStyle={fieldStyle(label)}
                buttonAfter={ <Button aria-label="Remove" bsStyle='danger' onClick={this.props.remove}><span aria-hidden="true">&times;</span></Button>}
                />
        </div>
    }
}


const DecoratedShareClassForm = reduxForm({
  form: 'shareClass',
  fields: ['label'],
  destroyOnUnmount: false
})(ShareClassForm)


@formProxy
export default class ShareClassesForm extends React.Component {
    static propTypes = {
        keyList: React.PropTypes.array
    };
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
        return  `${this.props.formKey}.shareClasses.${d}`;
    }

    render(){
        return <div>
            { this.props.keyList.map((d, i) => {
            return <DecoratedShareClassForm ref={d} key={d} formKey={this.getKey(d)}
                title={this.props.title}
                remove={() => this.props.remove(d)}
                register={this.register(d)} unregister={this.unregister(d)} />
            }) }
            </div>
    }
}