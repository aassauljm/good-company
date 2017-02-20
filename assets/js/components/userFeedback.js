"use strict";
import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import Input from './forms/input';
import { formFieldProps, requireFields } from '../utils';
import STRINGS from '../strings';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Raven from 'raven-js';
import { fetch } from '../utils';
import FormData from 'form-data';

@formFieldProps()
class FormFields extends React.Component {
    render() {
        return (
            <div>
                <Input type='text' {...this.formFieldProps('name', STRINGS.userFeedback)} />
                <Input type='email' {...this.formFieldProps('email', STRINGS.userFeedback)} />
                <Input type='textarea' {...this.formFieldProps('comment', STRINGS.userFeedback)} />
            </div>
        );
    }
}

class UserFeedbackForm extends React.Component {
    constructor(props) {
        super(props);
        this.send = ::this.send;

        let defaultName;
        let defaultEmail;
        try {
            defaultName = window.getState().userInfo.username;
            defaultEmail = window.getState().userInfo.email;
        } catch (e) {
            defaultName = '';
            defaultEmail = '';
        }

        this.state = {
            name: defaultName,
            email: defaultEmail,
            comment: ''
        };
    }

    send(e) {
        e.preventDefault();

        const sentryEvent = Raven.captureMessage('User feedback without error');

        const eventId = sentryEvent._lastEventId;
        const dsn = sentryEvent._dsn;
        const feedbackUrl = encodeURI('https://sentry.io/api/embed/error-page/?eventId=' + eventId + '&dsn=' + dsn);

        const body = new FormData();
        body.append('name', this.state.name);
        body.append('email', this.state.email);
        body.append('comments', this.state.comments);

        fetch(feedbackUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            body: body
        });

        this.props.hide();
    }

    render() {
        const fields = ['comment', 'email','name'].reduce((acc, field) => {
            const valid = !!this.state[field];
            acc[field] = {
                onChange: (e) => this.setState({ [field]: e.target.value }),
                valid: valid,
                touched: true,
                value: this.state[field],
                error: !valid && ['Required.']
            }

            return acc;
        }, {});

        const commentValid = !!this.state.comment;

        return (
            <Modal show={this.props.visible} onHide={this.props.hide}>
                <Modal.Header closeButton>
                    <Modal.Title>Something not working?</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <form>
                        <FormFields fields={fields}/>
                    </form>
                </Modal.Body>

                <Modal.Footer>
                    <Button bsStyle='default' onClick={this.props.hide}>Cancel</Button>
                    <Button bsStyle='primary' onClick={this.send} onClick={this.send}>Send</Button>
                </Modal.Footer>
            </Modal>
        );

        return false;
    }
}

export default class UserFeedback extends React.Component {
    constructor(props) {
        super(props);

        this.showForm = ::this.showForm;
        this.hideForm = ::this.hideForm;
        
        this.state = {
            visible: false
        }
    }

    showForm() {
        this.setState({
            visible: true
        });
    }

    hideForm() {
        this.setState({
            visible: false
        });
    }

    render() {
        return (
            <div style={this.props.style || {}}>
                <a className='btn btn-link hidden-xs hidden-sm' onClick={this.showForm}>Something not working?</a>
                <UserFeedbackForm visible={this.state.visible} hide={this.hideForm}/>
            </div>
        );
    }
}
