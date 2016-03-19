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
import { DirectorConnected, directorSubmit } from '../forms/person';
import { Director } from '../company';


@connect(undefined)
export class ManageDirectorsModal extends React.Component {
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
            const directors = this.props.modalData.companyState.directorList.directors;
            return <div className="row">
                <div className="col-md-6 col-md-offset-3">
                    { directors.map((p, i) => {
                        return <div className=" actionable" key={i} onClick={() => this.props.next({...this.props.modalData, director: p})}>
                                    <Director director={p} />
                                </div>
                        }) }
                <div className="button-row"><ButtonInput onClick={(e) => {
                       this.props.next({...this.props.modalData, director: null});
                    }}>Add Director</ButtonInput></div>
                </div>

                </div>
        },
        () => {
            return <div className="row">
                <div className="col-md-6 col-md-offset-3">
                    <DirectorConnected
                        ref="form"
                        initialValues={{...this.props.modalData.director,
                            effectiveDate: new Date(),
                            appointment: this.props.modalData.director ? new Date(this.props.modalData.director.appointment) : new Date()}}
                        edit={!!this.props.modalData.director}
                        onSubmit={this.submit}/>
                    </div>
                </div>
        }
    ]

    submit(values) {
        const transactions = directorSubmit(values, this.props.modalData.director)
        if(transactions.length){
            this.props.dispatch(companyTransaction(
                                    'compound',
                                    this.props.modalData.companyId,
                                    {transactions: transactions} ))
                .then(() => {
                    this.handleClose();
                    this.props.dispatch(addNotification({message: 'Directorships Updated.'}));
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
                <Modal.Title>Manage Directors</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                { this.pages[this.props.index].call(this) }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
                { this.props.index === 1 && this.props.modalData.director && <Button onClick={this.handleNext} bsStyle="primary">Update</Button> }
                { this.props.index === 1 && !this.props.modalData.director && <Button onClick={this.handleNext} bsStyle="primary">Create</Button> }
              </Modal.Footer>
            </Modal>
    }

}