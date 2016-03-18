"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from 'react-bootstrap/lib/ButtonInput';
import { connect } from 'react-redux';
import { reduxForm, change } from 'redux-form';
import Input from '../forms/input';
import Address from '../forms/address';
import PersonName from '../forms/personName';
import DateInput from '../forms/dateInput';
import { formFieldProps, requireFields, joinAnd } from '../../utils';
import { Link } from 'react-router';
import { companyTransaction, addNotification, showModal } from '../../actions';
import { routeActions } from 'react-router-redux';
import STRINGS from '../../strings';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';


export const fields = ['name', 'address']


@formFieldProps()
export class Person extends React.Component {
    static propTypes = {

    };
    render() {
        return <form className="form" >
        <fieldset>
            <PersonName {...this.formFieldProps('name')} />
            <Address {...this.formFieldProps('address')} />
        </fieldset>
        </form>
    }
}



const validate = requireFields('name', 'address');


const NewHoldingConnected = reduxForm({
  form: 'person',
  fields,
  validate
})(Person);


@connect(undefined)
export class PersonModal extends React.Component {
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
                <NewHoldingConnected
                    ref="form"
                    onSubmit={this.submit}/>
                </div>
            </div>

    }

    render() {
        // TODO, connect this to the form data, check valid and submitting, disable submit button
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
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