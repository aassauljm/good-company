"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { Link } from 'react-router';
import { companyTransaction, addNotification } from '../../actions';
import { UpdatePersonConnected, updatePersonSubmit } from '../forms/person';


@connect(undefined)
export class UpdatePersonModal extends React.Component {
    constructor(props) {
        super(props);
        this.submit = ::this.submit;
        this.handleClose = ::this.handleClose;
        this.handleNext = ::this.handleNext;
    }

    handleNext() {
        this.refs.form.submit();
    }

    handleClose(data={}) {
        this.props.end(data);
    }


    renderBody() {
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <UpdatePersonConnected
                    ref="form"
                    initialValues={{effectiveDate: new Date(), ...this.props.modalData.person}}
                    onSubmit={this.submit}/>
                </div>
            </div>
    }

submit(values) {
        const transactions = updatePersonSubmit(values, this.props.modalData.person)
        if(transactions.length){
            this.props.dispatch(companyTransaction(
                                    'compound',
                                    this.props.modalData.companyId,
                                    {transactions: transactions} ))
                .then(() => {
                    this.handleClose({reload: true});
                    this.props.dispatch(addNotification({message: 'Person Updated'}));
                    const key = this.props.modalData.companyId;
                })
                .catch((err) => {
                    this.props.dispatch(addNotification({message: err.message, error: true}));
                })
        }
        else{
            this.handleClose();
        }
    }

    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Update Shareholder</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                { this.renderBody(this) }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
                <Button onClick={this.handleNext} bsStyle="primary">Update</Button>
              </Modal.Footer>
            </Modal>
    }

}