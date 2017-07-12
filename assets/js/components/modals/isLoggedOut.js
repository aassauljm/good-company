"use strict";
import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import Input from '../forms/input';
import STRINGS from '../../strings';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { hideIsLoggedOut } from '../../actions';
import { connect } from 'react-redux';
import { Link } from 'react-router';


@connect((state) => ({loginUrl: state.login.loginUrl, path: state.routing.locationBeforeTransitions.pathname}),
{
    hide: () => hideIsLoggedOut(),
})
export default class IsLoggedOut extends React.Component {
    constructor(props) {
        super(props);
        this.close = ::this.close;
    }

    close() {
        this.props.hide();
    }

    render() {
        const query = encodeURIComponent(this.props.path);
        const url= `${this.props.loginUrl}?next=${query}`
        return (
            <Modal show={true}  onHide={this.close} className="preview"  backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>Session has Expired</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                <p>Your Good Companies session has expired.</p>
                <p>Click the <strong>Login</strong> button to sign back in.</p>
                </Modal.Body>
                <Modal.Footer>
                    <a href={url} className="btn btn-primary">Login</a>
                </Modal.Footer>
            </Modal>
        );
        return false;
    }

}
