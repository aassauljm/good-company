"use strict";
import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { endConfirmation, hideVersionWarning } from '../actions';
import { LoadingOverlay } from './loading';
import EmailDocument from './modals/emailDocument';


export class Confirmation extends React.Component {
    constructor(){
        super();
        this.resolve = ::this.resolve;
        this.reject = ::this.reject;
    }

    resolve() {
        this.props.dispatch(this.props.resolveAction);
        this.props.dispatch(endConfirmation());
    }

    reject() {
        this.props.dispatch(this.props.cancelAction);
        this.props.dispatch(endConfirmation());
    }

    render() {
        const {title, description, cancelMessage, resolveMessage} = this.props;
        return <Modal show={true} onHide={this.reject} ref="modal">
            <Modal.Header closeButton>
            <Modal.Title>{ title || 'Confirm' }</Modal.Title>
          </Modal.Header>
         <Modal.Body>
            { description || 'Please confirm the action' }
         </Modal.Body>
          <Modal.Footer>
            <Button bsStyle={this.props.cancelBsStyle} onClick={this.reject}>{ cancelMessage || 'Cancel' }</Button>
            <Button bsStyle={this.props.resolveBsStyle} onClick={this.resolve}>{ resolveMessage || 'Confirm' }</Button>
          </Modal.Footer>
        </Modal>
        return false;
    }
}

function NewGCVersionModal(props) {
    return (
        <Modal show={true} onHide={props.hide}>
            <Modal.Header closeButton>
                <Modal.Title>New Version of Good Companies</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                A new version of Good Companies has been released. Please click refresh to get the latest version.
            </Modal.Body>

            <Modal.Footer>
                <Button onClick={props.hide}>Ignore</Button>
                <Button bsStyle='primary' onClick={() => location.reload()}>Refresh</Button>
            </Modal.Footer>
        </Modal>
    );
}

const ConfirmationConnected = connect()(Confirmation);


export function Loading(props) {
    return <LoadingOverlay message={props.message} animationTime={props.animationTime}/>
}

@connect(state => ({modals: state.modals}), {
    hideVersionWarning: () => hideVersionWarning(),
})
export default class Modals extends React.Component {
    render() {
        if(this.props.modals.confirmation && this.props.modals.confirmation.showing){
            return <ConfirmationConnected {...this.props.modals.confirmation} />
        }
        else if(this.props.modals.loading && this.props.modals.loading.showing){
            return <Loading {...this.props.modals.loading} />
        }
        else if (this.props.modals.emailDocument && this.props.modals.emailDocument.showing) {
            return <EmailDocument {...this.props.modals.emailDocument} />
        }
        else if (this.props.modals.versionWarning && this.props.modals.versionWarning.showing) {
            return <NewGCVersionModal hide={this.props.hideVersionWarning} />
        }

        return false;
    }

}
