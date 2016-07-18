"use strict";
import React from 'react';
import Modal from '../forms/modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { personList } from '../../utils';
import { deleteResource, addNotification } from '../../actions';
import { push } from 'react-router-redux';

@connect((state, ownProps) => {
    return {};
}, (dispatch, ownProps) => {
    return {
        resetAction: (args) => {
            return dispatch(deleteResource(`/company/${ownProps.modalData.companyId}`, {}, {}))
            .then(() => {
                ownProps.end();
                dispatch(push('/'))
                dispatch(addNotification({message: 'Company Deleted.'}));
            })
        }
    }
})
export class DeleteCompanyModal extends React.Component {
    constructor(props) {
        super(props);
        this.handleDelete = ::this.handleDelete;
        this.handleClose = ::this.handleClose;
    }

    handleClose() {
        this.props.end();
    }

    handleDelete() {
        this.props.resetAction();
    }

    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Delete Company</Modal.Title>
              </Modal.Header>
              <Modal.Body>
              <p>Selected 'Delete Company' will remove this company from your account. </p>
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
                <Button onClick={this.handleDelete} bsStyle="danger">Delete Company</Button>
              </Modal.Footer>
            </Modal>
    }

}