"use strict";
import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import STRINGS from '../../strings';
import { sendDocument, hideEmailDocument, addNotification, showUpdate } from '../../actions';
import { connect } from 'react-redux';
import { EmailListForm, directorEmailUpdateTransaction } from '../forms/email'
import Loading from '../loading';


@connect(state => ({transactionViews: state.transactionViews || DEFAULT_OBJ, sendDocument: state.sendDocument}),
{
    hide: () => hideEmailDocument(),
    send: (recipients, renderData, meta) => sendDocument(recipients, renderData, meta)
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
        const meta = {
            onSuccess: [addNotification({
                    message: 'Document sent'
                }), hideEmailDocument()],
            onFailure: [addNotification({
                    message: 'Failed to send',
                    error: true
            })]
        }
        const changes = directorEmailUpdateTransaction(values);
        if(changes.length){
            meta.onSuccess.push(showUpdate({updateType: 'directorEmails', companyId: this.props.renderData.companyId, transactions: changes}))
        }
        this.props.send(values.recipients, this.props.renderData, meta);
    }

    close() {
        this.props.hide();
    }

    render() {
        const loading = this.props.sendDocument._status === 'fetching';
        return (
            <Modal show={true} onHide={this.close} backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>Email Document</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p></p>
                    { loading && <Loading/ > }
                    { !loading && <EmailListForm initialValues={{recipients: [{}]}} companyState={this.props.renderData.companyState} companyId={this.props.renderData.companyId} ref="form" onSubmit={this.send} /> }
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
