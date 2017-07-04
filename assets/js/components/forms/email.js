"use strict";
import React from 'react';
import Button from 'react-bootstrap/lib/Button';
import Input from '../forms/input';
import { formFieldProps, requireFields } from '../../utils';
import STRINGS from '../../strings';
import { reduxForm } from 'redux-form';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { connect } from 'react-redux';

const fields = [
    'recipients[].name',
    'recipients[].email'
];

@formFieldProps()
export class Recipient extends React.Component {
    render() {
        return (
            <div className="input-group-with-remove col-xs-12">
                <div>
                    <Input type="text" {...this.formFieldProps('name')} label="" placeholder={STRINGS.emailRecipients.name} />
                </div>
                <div >
                    <Input type="text" {...this.formFieldProps('email')} label="" placeholder={STRINGS.emailRecipients.email} />
                </div>
                <div>
                    <button className="btn btn-default remove-parcel" onClick={(e) => {
                        e.preventDefault();
                        this.props.remove();
                    }}><Glyphicon glyph='trash'/></button>
                </div>
            </div>
        );
    }
}

const requireRecipient = requireFields('name', 'email');

@reduxForm({
    form: 'emailList',
    fields,
    validate: (values) => {
        return {
            recipients: values.recipients.map(requireRecipient),
            _error: values.recipients.length ? null : ['At least one recipient required']
        };
    }
})
export class EmailListForm extends React.Component {
    render() {
        const { fields:{recipients} } = this.props;

        return (
            <form>
                {recipients.map((recipient, index) => <Recipient fields={recipient} key={index} remove={() => { recipients.removeField(index) }} />)}

                <div className='button-row'>
                    <Button onClick={() => { recipients.addField({}) }}>Add Recipient</Button>
                </div>

                { this.props.error && this.props.error.map((e, i) => <div key={i} className="alert alert-danger">{ e }</div>)}
            </form>
        );
    }
}