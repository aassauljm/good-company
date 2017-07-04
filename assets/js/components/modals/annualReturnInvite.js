"use strict";
import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import STRINGS from '../../strings';
import { sendDocument, hideARInvite, addNotification } from '../../actions';
import { connect } from 'react-redux';
import { EmailListForm } from '../forms/email'

@connect(state => ({transactionViews: state.transactionViews || DEFAULT_OBJ, sendDocument: state.sendDocument}),
{
    hide: () => hideARInvite(),
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
            <Modal show={true} onHide={this.close}  backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>Invite Others to Review Annual Return</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p></p>
                    <EmailListForm initialValues={{recipients: [{}]}} ref="form" onSubmit={this.send} />
                </Modal.Body>
                <Modal.Footer>
                    <Button bsStyle='default' onClick={this.close}>Cancel</Button>
                    <Button bsStyle='primary' onClick={() => this.refs.form.submit()}>Invite</Button>
                </Modal.Footer>
            </Modal>
        );
        return false;
    }

}
