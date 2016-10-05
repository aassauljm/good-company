"use strict";
import React, {PropTypes} from 'react';
import Modal from '../forms/modal';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from '../forms/buttonInput';
import { connect } from 'react-redux';
import { reduxForm, change, destroy  } from 'redux-form';
import Input from '../forms/input';
import Address from '../forms/address';
import PersonName from '../forms/personName';
import { HoldingNoParcelsConnected, reformatPersons } from '../forms/holding';
import { formFieldProps, requireFields, joinAnd, personOptionsFromState } from '../../utils';
import { Link } from 'react-router';
import { companyTransaction, addNotification, showModal } from '../../actions';
import STRINGS from '../../strings';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import StaticField from '../forms/staticField';


@connect(undefined)
export class NewHoldingModal extends React.Component {
    constructor(props) {
        super(props);
        this.submit = ::this.submit;
        this.handleClose = ::this.handleClose;
    }

    handleNext() {
        this.refs.form.submit();
    }

    handleClose() {
        this.props.dispatch(destroy('newHolding'));
        this.props.end();
    }

    submit(values) {
        if(this.props.modalData.afterClose){
            const persons = reformatPersons(values, this.props.modalData.companyState);
            this.props.dispatch(change(this.props.modalData.formName, this.props.modalData.field, {...values, persons: persons}));
            this.handleClose();
            return;
        }
        this.handleClose();
    }

    renderBody(companyState) {
        const personOptions = personOptionsFromState(companyState);
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <HoldingNoParcelsConnected
                    ref="form"
                    form='newHolding'
                    initialValues={{persons: [{}]}}
                    personOptions={personOptions}
                    showModal={(key, index) => this.props.dispatch(showModal(key, {
                        ...this.props.modalData,
                        formName: 'newHolding',
                        field: `persons[${index}].newPerson`,
                        afterClose: { // open this modal again
                            showModal: {key: 'newHolding', data: {...this.props.modalData}}
                        }
                    }))}
                    onSubmit={this.submit}/>
                </div>
            </div>

    }

    render() {
        return  <Modal ref="modal" show={true} bsSize="large" animation={!this.props.modalData.afterClose} onHide={this.handleClose} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>New Holding</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                { this.renderBody(this.props.modalData.companyState) }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.handleClose} >Cancel</Button>
                 <Button onClick={::this.handleNext} bsStyle="primary">Create</Button>
              </Modal.Footer>
            </Modal>
    }

}