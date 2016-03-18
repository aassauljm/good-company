"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from 'react-bootstrap/lib/ButtonInput';
import { connect } from 'react-redux';
import { reduxForm, change, destroy  } from 'redux-form';
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
import StaticField from 'react-bootstrap/lib/FormControls/Static';

export const fields = [
    'holdingName',
    'persons[].personId',
    'persons[].newPerson'
    ]

// TODO move to forms
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

                        { !p.newPerson.value && <Input type="select" {...this.formFieldProps(['persons', i, 'personId'])} label={'Existing Persons'} >
                            <option></option>
                            { this.props.personOptions }
                        </Input> }

                        { !p.newPerson.value &&
                        <div className="button-row"><ButtonInput onClick={() => {
                            this.props.showModal('person', i);
                        }}>Create New Person</ButtonInput></div> }

                    { p.newPerson.value  &&
                        <StaticField type="static" label={'New Person'} value={p.newPerson.value.name}
                        buttonAfter={<button className="btn btn-default" onClick={(e) => {
                            p.newPerson.onChange(null);
                        }}><Glyphicon glyph='trash'/></button>} /> }

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


const validate = (values, props) => {
    const errors = {}
    const personId = [];
    errors.persons = values.persons.map((p, i) => {
        const errors = {};
        if(p.personId && personId.indexOf(p.personId) >= 0){
            errors.personId = (errors.personId || []).concat(['Person already included.'])
        }
        personId.push(p.personId);
        if(!p.personId && !p.newPerson){
            errors.personId = (errors.personId || []).concat(['Required'])
        }
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
  validate,
  destroyOnUnmount: false
})(NewHolding);


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

            const persons = values.persons.map(p => {
                if(p.newPerson){
                    return p.newPerson;
                }
                else{
                    const id = parseInt(p.personId);
                    let result;
                    this.props.modalData.companyState.holdingList.holdings.map((h) => {
                        h.holders.map((p) => {
                            if(p.personId === id){
                                result = p;
                            }
                        });
                    });
                    return result;
                }
            });
                this.props.dispatch(change(this.props.modalData.formName, this.props.modalData.field, {...values, persons: persons}));
                this.handleClose();
            return;
        }
        this.handleClose();
    }

    renderBody(companyState) {
        const persons = companyState.holdingList.holdings.reduce((acc, h) => {
            return h.holders.reduce((acc, p) => {
                acc[p.personId] = p.name;
                return acc;
            }, acc);
        }, {});
        const orderedPersons = Object.keys(persons).map(k => {
            return {name: persons[k], id: k};
        })
        orderedPersons.sort((a, b) => a.name.localeCompare(b));
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <NewHoldingConnected
                    ref="form"
                    initialValues={{persons: [{}]}}
                    personOptions={orderedPersons.map((p, i) => <option key={i} value={p.id}>{p.name}</option>)}
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
        // TODO, connect this to the form data, check valid and submitting, disable submit button
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>New Holding</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                { this.renderBody(this.props.modalData.companyState) }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.props.handleClose} >Cancel</Button>
                 <Button onClick={::this.handleNext} bsStyle="primary">Create</Button>
              </Modal.Footer>
            </Modal>
    }

}