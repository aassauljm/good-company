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


export const fields = ['newHolding.holdingName', 'newHolding.persons[].name', 'newHolding.persons[].address', 'newHolding.use']


@formFieldProps()
export class NewHolding extends React.Component {
    static propTypes = {

    };

    render() {
        return <form className="form" >
        <fieldset>
            <Input type='text' {...this.formFieldProps(['newHolding', 'holdingName'])} />
            { this.props.fields.newHolding.persons.map((p, i) =>{
                return <div className="row " key={i}>
                <div className="col-full-h">
                    <div className="col-xs-9 left">
                        <PersonName {...this.formFieldProps(['newHolding','persons', i, 'name'])} />
                        <Address {...this.formFieldProps(['newHolding','persons', i, 'address'])} />
                    </div>
                    <div className="col-xs-3 right">
                    <button className="btn btn-default" onClick={(e) => {
                        e.preventDefault();
                        this.props.fields.newHolding.persons.removeField(i)
                    }}><Glyphicon glyph='trash'/></button>
                    </div>
                </div>
                </div>
            })}
            <div className="button-row"><ButtonInput onClick={() => {
                this.props.fields.newHolding.persons.addField();
            }}>Add Person</ButtonInput></div>
        </fieldset>
        </form>
    }
}



const validatePerson = requireFields('name', 'address');

const validate = (values, props) => {
    const errors = {newHolding: {}}
    const names = [];
    errors.newHolding.persons = values.newHolding.persons.map((p, i) => {
        let errors = validatePerson(p)
        if(p.name && names.indexOf(p.name) >= 0){
            errors.name = (errors.name || []).concat(['Name already used.'])
        }
        names.push(p.name);
        return errors;
    });
    return errors;

}

export function newHoldingFormatSubmit(values, companyState){
    const action = {
        transactionType: 'NEW_ALLOCATION',
        holders: values.persons,
        name: values.holdingName
    }
    return {actions: [action]}
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
            this.props.dispatch(change(this.props.modalData.formName || 'newHolding', 'newHolding.use', true))
            this.props.end();
            return;
        }
        this.props.end();
    }

    renderBody(companyState, form, formKey) {
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <NewHoldingConnected ref="form"
                    form={form || 'newHolding'}
                    formKey={formKey}
                    initialValues={{newHolding: {persons: [{}]}}}
                    destroyOnUnmount={!form}
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
                { this.renderBody(this.props.modalData.companyState, this.props.modalData.formName,this.props.modalData.formKey) }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.props.end} >Cancel</Button>
                 <Button onClick={::this.handleNext} bsStyle="primary">Create</Button>
              </Modal.Footer>
            </Modal>
    }

}