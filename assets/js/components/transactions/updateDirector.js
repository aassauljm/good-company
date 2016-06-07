"use strict";
import React, {PropTypes} from 'react';
import Modal from '../forms/modal';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from 'react-bootstrap/lib/ButtonInput';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from '../forms/input';
import { formFieldProps, requireFields, joinAnd, personList } from '../../utils';
import { Link } from 'react-router';
import { companyTransaction, addNotification, showModal } from '../../actions';
import STRINGS from '../../strings';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { DirectorConnected, NewDirectorConnected, directorSubmit } from '../forms/person';
import { Director } from '../company';
import { personOptionsFromState } from '../../utils';



@connect(undefined)
export class UpdateDirectorModal extends React.Component {
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
                { this.props.modalData.director ? this.updateDirector() : this.newDirector() }
                </div>
            </div>
    }

    updateDirector() {
        return <DirectorConnected
            ref="form"
            initialValues={{...this.props.modalData.director,
                appointment: new Date(this.props.modalData.director.appointment) }}
            onSubmit={this.submit}/>
    }

    newDirector() {
        const personOptions = personOptionsFromState(this.props.modalData.companyState);
        return <NewDirectorConnected
            ref="form"
            initialValues={{...this.props.modalData.director,
                appointment: new Date() }}
                personOptions={personOptions}
                newPerson={() => this.props.dispatch(showModal('newPerson', {
                    ...this.props.modalData,
                    formName: 'director',
                    field: `newPerson`,
                    afterClose: { // open this modal again
                        showModal: {key: 'manageDirectors', data: {...this.props.modalData, index: this.props.index}}
                    }
                }))}

            onSubmit={this.submit}/>
    }

    submit(values) {
        const transactions = directorSubmit(values, this.props.modalData.director, this.props.modalData.companyState)
        if(transactions.length){
            this.props.dispatch(companyTransaction(
                                    'compound',
                                    this.props.modalData.companyId,
                                    {transactions: transactions, documents: values.documents} ))
                .then(() => {
                    this.handleClose({reload: true});
                    this.props.dispatch(addNotification({message: 'Directorship Updated.'}));
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
                <Modal.Title>Manage Directors</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                { this.renderBody() }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
                { this.props.modalData.director && <Button onClick={this.handleNext} bsStyle="primary">Update</Button> }
                { !this.props.modalData.director && <Button onClick={this.handleNext} bsStyle="primary">Create</Button> }
              </Modal.Footer>
            </Modal>
    }

}