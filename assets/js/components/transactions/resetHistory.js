"use strict";
import React from 'react';
import Modal from '../forms/modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { personList } from '../../utils';
import { updateResource, addNotification } from '../../actions';



@connect((state, ownProps) => {
    return {};
}, (dispatch, ownProps) => {
    return {
        resetAction: (args) => {
            return dispatch(updateResource(`/company/${ownProps.modalData.companyId}/reset_pending_history`, {}, {}))
            .then(() => {
                ownProps.end();
                dispatch(addNotification({message: 'Company History Reset'}));
            })
        }
    }
})
export class ResetHistoryModal extends React.Component {
    constructor(props) {
        super(props);
        this.handleReset = ::this.handleReset;
        this.handleClose = ::this.handleClose;
    }

    handleClose() {
        this.props.end();
    }

    handleReset() {
        this.props.resetAction();
    }

    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Reset Company History</Modal.Title>
              </Modal.Header>
              <Modal.Body>
              <p>Selecting 'Reset Company History' below will undo any historic transactions imported from the companies office.</p>
              <p>You will be able to import again afterwards.</p>
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
                <Button onClick={this.handleReset} bsStyle="danger">Reset Company History</Button>
              </Modal.Footer>
            </Modal>
    }

}