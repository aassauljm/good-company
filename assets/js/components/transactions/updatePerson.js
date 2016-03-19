"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from 'react-bootstrap/lib/ButtonInput';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from '../forms/input';
import { formFieldProps, requireFields, joinAnd, personList } from '../../utils';
import { Link } from 'react-router';
import { companyTransaction, addNotification, showModal } from '../../actions';
import { routeActions } from 'react-router-redux';
import STRINGS from '../../strings';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { UpdatePersonConnected, updatePersonSubmit } from '../forms/person';
import { HoldingDL } from '../company';


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

    handleClose() {
        this.props.end();
    }

    pages = [
        () => {
            const persons = personList(this.props.modalData.companyState)
            return <div className="row">
                <div className="col-md-6 col-md-offset-3">
                { persons.map((p, i) => {

                    return <div className="holding well actionable" key={i} onClick={() => this.props.next({...this.props.modalData, person: p})}>
                                <dl className="dl-horizontal">
                                    <dt>Name</dt>
                                    <dd>{ p.name}</dd>
                                    <dt>Address</dt>
                                    <dd><span className="address">{ p.address}</span></dd>
                                </dl>
                            </div>
                    }) }
                </div>
                </div>
        },
        () => {
            return <div className="row">
                <div className="col-md-6 col-md-offset-3">
                    <UpdatePersonConnected
                        ref="form"
                        initialValues={{effectiveDate: new Date(), ...this.props.modalData.person}}
                        onSubmit={this.submit}/>
                    </div>
                </div>
        }
    ]

    submit(values) {
        const transactions = updatePersonSubmit(values, this.props.modalData.person)
        if(transactions.length){
            this.props.dispatch(companyTransaction(
                                    'compound',
                                    this.props.modalData.companyId,
                                    {transactions: transactions} ))
                .then(() => {
                    this.handleClose();
                    this.props.dispatch(addNotification({message: 'Person Updated'}));
                    const key = this.props.modalData.companyId;
                    this.props.dispatch(routeActions.push(`/company/view/${key}`))
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
                <Modal.Title>Update Shareholding</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                { this.pages[this.props.index].call(this) }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
                { this.props.index === 1 && <Button onClick={this.handleNext} bsStyle="primary">Create</Button> }
              </Modal.Footer>
            </Modal>
    }

}