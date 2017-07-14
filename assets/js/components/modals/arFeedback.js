"use strict";
import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import Input from '../forms/input';
import STRINGS from '../../strings';
import { reduxForm } from 'redux-form';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { hideARFeedback, updateResource } from '../../actions';
import { connect } from 'react-redux';
@connect(undefined,
{
    hide: () => hideARFeedback(),
    updateARConfirmation: (...args) => updateResource(...args)
})
export default class ARFeedback extends React.Component {
    constructor(props) {
        super(props);
        this.confirm = ::this.confirm;
        this.close = ::this.close;
        if(typeof document !== 'undefined'){
            this.quill = require('react-quill');
        }
    }

    confirm() {
        this.props.updateARConfirmation(`/ar_confirmation/${this.props.renderData.code}`, {confirmed: true});
        this.props.hide();
    }

    close() {
        this.props.hide();
    }

    render() {
        const Quill = this.quill;
        return (
            <Modal show={true} bsSize="large" onHide={this.close} backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>Annual Return Feedback</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    { Quill && <Quill value={this.props.renderData.feedback} readOnly={true}  modules={{toolbar: false}}/> }
                </Modal.Body>
                <Modal.Footer>
                    <Button bsStyle='default' onClick={this.close}>Close</Button>
                    <Button bsStyle='primary' onClick={this.confirm}>Mark as Confirmed</Button>
                </Modal.Footer>
            </Modal>
        );
        return false;
    }

}
