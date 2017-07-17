"use strict";
import React from 'react';
import Button from 'react-bootstrap/lib/Button';
import Input from '../forms/input';
import { formFieldProps, requireFields } from '../../utils';
import STRINGS from '../../strings';
import { reduxForm } from 'redux-form';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { connect } from 'react-redux';
import { ForeignPermissionsHOC } from '../../hoc/resources';
import { enums as TransactionTypes } from '../../../../config/enums/transactions';

export function directorEmailUpdateTransaction(values) {
    const changes = values.recipients.filter(r => {
        return (typeof r.name !== 'string') && r.name.director && r.email !== r.name.email
    }).map((d) => {
        return {
            personId: d.name.personId,
            name: d.name.name,
            address: d.name.address,
            attr: {...(d.attr || {}), email: d.email}
        }
    })
    .map(values => ({
        transactionType: TransactionTypes.UPDATE_DIRECTOR,
        actions: [{
            transactionType: TransactionTypes.UPDATE_DIRECTOR,
            beforeName: values.name,
            afterName: values.name,
            beforeAddress: values.address,
            afterAddress: values.address,
            personId: values.personId,
            personAttr: values.attr
        }]
    }));
    return changes;
};


const fields = [
    'recipients[].name',
    'recipients[].email'
];

@formFieldProps()
export class Recipient extends React.PureComponent {
    render() {
        return (
            <div className="input-group-with-remove">
                <div>
                    <Input type="combo" {...this.formFieldProps('name')} label=""
                        placeholder={STRINGS.emailRecipients.name}
                        comboData={this.props.emailAddresses}
                        groupBy='type'
                        textField='name'
                        valueField='index'
                        suggest={true}
                        onBlur={() => {
                            // prevent the value of being set
                        }}
                        onSelect={(value) => {
                            this.props.fields.email.onChange({value: value.email || ''});
                        }}/>
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
@ForeignPermissionsHOC()
@connect((state, ownProps) => {
    const emailAddresses = [];
    let counter = 0;
    ownProps.companyState.directorList.directors.map(d => {
        return emailAddresses.push({...d.person, email: (d.person.attr || {}).email, director: true, type: 'Directors', index: (counter++)+''});
    });
    (ownProps.foreignPermissions.data || []).filter(u => u.organisation).map(o => {
        return emailAddresses.push({...o, type: 'Organisation', index: (counter++)+''});
    });
    (ownProps.foreignPermissions.data || []).filter(u => !u.organisation).map(f => {
        return emailAddresses.push({...f, type: 'External Users', index: (counter++)+''})
    });
    return {
        emailAddresses: emailAddresses
    }})
export class EmailListForm extends React.PureComponent {
    render() {
        const { fields:{recipients} } = this.props;
        return (
            <form>


                {recipients.map((recipient, index) => <Recipient fields={recipient} key={index} emailAddresses={this.props.emailAddresses} remove={() => { recipients.removeField(index) }} />)}

                <div className='button-row'>
                    <Button onClick={() => { recipients.addField({}) }}>Add Recipient</Button>
                </div>

                { this.props.error && this.props.error.map((e, i) => <div key={i} className="alert alert-danger">{ e }</div>)}
            </form>
        );
    }
}