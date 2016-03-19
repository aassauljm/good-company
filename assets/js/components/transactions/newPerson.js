"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from 'react-bootstrap/lib/ButtonInput';
import { connect } from 'react-redux';
import { change } from 'redux-form';
import { NewPersonConnected } from '../forms/person';



@connect(undefined)
export class NewPersonModal extends React.Component {
    constructor(props) {
        super(props);
        this.submit = ::this.submit;
    }

    handleNext() {
        this.refs.form.submit();
    }

    submit(values) {
        if(this.props.modalData.afterClose){
            this.props.dispatch(change(this.props.modalData.formName, this.props.modalData.field, values));
            this.props.end();
            return;
        }
        this.props.end();
    }

    renderBody(companyState) {
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <NewPersonConnected
                    ref="form"
                    onSubmit={this.submit}/>
                </div>
            </div>

    }

    render() {
        // TODO, connect this to the form data, check valid and submitting, disable submit button
        return  <Modal ref="modal" show={true} bsSize="large" animation={!this.props.modalData.afterClose} onHide={this.props.end} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Create New Person</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                { this.renderBody(this.props.modalData.companyState) }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.props.end} >Cancel</Button>
                 <Button onClick={::this.handleNext} bsStyle="primary">Create</Button>
              </Modal.Footer>
            </Modal>
    }
}


