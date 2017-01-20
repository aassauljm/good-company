"use strict";
import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import Input from '../forms/input';
import { formFieldProps, requireFields } from '../../utils';
import STRINGS from '../../strings';
import { reduxForm } from 'redux-form';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { sendDocument, hideEmailDocument, addNotification } from '../../actions';
import { connect } from 'react-redux';

const fields = [
    'recipients[].name',
    'recipients[].email'
];

@formFieldProps()
class Recipient extends React.Component {
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
class EmailListForm extends React.Component {
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

@connect(state => ({transactionViews: state.transactionViews || DEFAULT_OBJ, sendDocument: state.sendDocument}),
{
    hide: () => hideEmailDocument(),
    send: (recipients, renderData) => sendDocument(recipients, renderData),
    addNotification: (data) => addNotification(data)
})
export default class EmailDocument extends React.Component {
    constructor() {
        super();
        this.send = ::this.send;
        this.close = ::this.close;
    }

    send(values) {
        if(this.props.sendDocument._status === 'fetching'){
            return;
        }
        this.props.send(values.recipients, this.props.renderData)
            .then(() => {
                this.props.addNotification({
                    message: 'Document sent'
                });
                this.close();
            }).catch((error) => {
                this.props.addNotification({
                    message: 'Failed to send',
                    error: true
                });
            });
    }

    close() {
        this.props.hide();
    }

    render() {
        return (
            <Modal show={true} onHide={this.close}>
                <Modal.Header closeButton>
                    <Modal.Title>Email Document</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p></p>
                    <EmailListForm initialValues={{recipients: [{}]}} ref="form" onSubmit={this.send} />
                </Modal.Body>
                <Modal.Footer>
                    <Button bsStyle='default' onClick={this.close}>Cancel</Button>
                    <Button bsStyle='primary' onClick={() => this.refs.form.submit()}>Send</Button>
                </Modal.Footer>
            </Modal>
        );
        return false;
    }

}
