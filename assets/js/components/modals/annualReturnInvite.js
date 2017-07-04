"use strict";
import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import STRINGS from '../../strings';
import { createResource, hideARInvite, addNotification } from '../../actions';
import { connect } from 'react-redux';
import { EmailListForm } from '../forms/email'

@connect(state => ({transactionViews: state.transactionViews || DEFAULT_OBJ, sendDocument: state.sendDocument}),
{
    hide: () => hideARInvite(),
    invite: (...args) => createResource(...args),
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
        const data = {
            year: this.props.renderData.arData.companyFilingYear,
            arData: this.props.renderData.arData,
            arConfirmationRequests: values.recipients
        }
        const url = `/company/${this.props.renderData.companyId}/ar_confirmation`
        this.props.invite(url, data)
            .then(() => {
                this.props.addNotification({
                    message: 'Review invitations sent'
                });
                this.close();
            }).catch((error) => {
                this.props.addNotification({
                    message: 'Failed to send review invitations',
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
                    <p>Add names and email address below to invite others to review the current annual return.  </p>
                    <p>They will receive a link to view and confirm the accuracy of the document, and if necessary, provide feedback for you to evaulate.</p>
                    <p></p>
                    <EmailListForm initialValues={{recipients: [{}]}} ref="form" onSubmit={this.send} />
                </Modal.Body>
                <Modal.Footer>
                    <Button bsStyle='default' onClick={this.close}>Cancel</Button>
                    <Button bsStyle='primary' onClick={() => this.refs.form.submit()}>Send Review Requests</Button>
                </Modal.Footer>
            </Modal>
        );
        return false;
    }

}
