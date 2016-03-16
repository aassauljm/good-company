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


export const fields = ['holdingName', 'persons[].name', 'persons[].address', 'use']


@formFieldProps()
export class NewHolding extends React.Component {
    static propTypes = {

    };

    render() {
        return <form className="form" >
        <fieldset>
            <Input type='text' {...this.formFieldProps([ 'holdingName'])} />
            { this.props.fields.persons.map((p, i) =>{
                return <div className="row " key={i}>
                <div className="col-full-h">
                    <div className="col-xs-9 left">
                        <PersonName {...this.formFieldProps(['persons', i, 'name'])} />
                        <Address {...this.formFieldProps(['persons', i, 'address'])} />
                    </div>
                    <div className="col-xs-3 right">
                    <button className="btn btn-default" onClick={(e) => {
                        e.preventDefault();
                        this.props.fields.persons.removeField(i)
                    }}><Glyphicon glyph='trash'/></button>
                    </div>
                </div>
                </div>
            })}
            <div className="button-row"><ButtonInput onClick={() => {
                this.props.fields.persons.addField();
            }}>Add Person</ButtonInput></div>
        </fieldset>
        </form>
    }
}



const validatePerson = requireFields('name', 'address');

const validate = (values, props) => {
    const errors = {newHolding: {}}
    const names = [];
    errors.persons = values.persons.map((p, i) => {
        let errors = validatePerson(p)
        if(p.name && names.indexOf(p.name) >= 0){
            errors.name = (errors.name || []).concat(['Name already used.'])
        }
        names.push(p.name);
        return errors;
    });
    return errors;

}

export function newHoldingFormatAction(values){
    const action = {
        transactionType: 'NEW_ALLOCATION',
        holders: values.persons,
        name: values.holdingName
    }
    return action;
}

const NewHoldingConnected = reduxForm({
  form: 'newHolding',
  fields,
  validate
})(NewHolding);


@connect(undefined)
export class NewHoldingModal extends React.Component {
    constructor(props) {
        super(props);
        this.submit = ::this.submit;
    }

    handleNext() {
        this.refs.form.submit();
    }

    submit(values) {
        if(this.props.modalData.afterClose){
            // delegate this
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
                    initialValues={{persons: [{}]}}
                    onSubmit={this.submit}/>
                </div>
            </div>

    }

    render() {
        // TODO, connect this to the form data, check valid and submitting, disable submit button
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>New Holding</Modal.Title>
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