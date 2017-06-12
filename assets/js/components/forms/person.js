import React from 'react';
import PropTypes from 'prop-types';
import Address from './address';
import Country from './country';
import PersonName from './personName';
import Input from './input';
import ButtonInput from './buttonInput';
import { reduxForm } from 'redux-form';
export const fields = ['name', 'address']
import { formFieldProps, requireFields, populatePerson } from '../../utils';
import DateInput from './dateInput';
import { Documents } from './documents';
import { enums as TransactionTypes } from '../../../../config/enums/transactions';
import StaticField from './staticField';
import STRINGS from '../../strings';
import moment from 'moment';
import WorkingDays from './workingDays';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Button from 'react-bootstrap/lib/Button';


const CREATE_NEW_PERSON = 'CREATE_NEW_PERSON';


@formFieldProps()
export class Person extends React.Component {
    static propTypes = {

    };
    render() {
        const isNatural = !this.props.fields.attr.isNaturalPerson || this.props.fields.attr.isNaturalPerson.value;
        return <form className="form" >
            <fieldset>
                { this.props.fields.effectiveDate && <DateInput{...this.formFieldProps('effectiveDate')} /> }
                <PersonName {...this.formFieldProps('name')} />
                { this.props.fields.attr.isNaturalPerson && <Input type="checkbox"  {...this.formFieldProps(['attr', 'isNaturalPerson'], STRINGS.persons)} /> }

                { !isNatural &&  <Input type="text"  {...this.formFieldProps('companyNumber')} /> }

                <Address {...this.formFieldProps('address', isNatural ? STRINGS.persons.naturalPerson : STRINGS.persons.notNaturalPerson) } />
                <Address {...this.formFieldProps(['attr', 'postalAddress'])} label={'Postal Address (if different)'} />

                <Input type="text"  {...this.formFieldProps(['attr', 'email'], STRINGS.persons)} />
                <Input type="text"  {...this.formFieldProps(['attr', 'fax'], STRINGS.persons)} />
                <Input type="text"  {...this.formFieldProps(['attr', 'phone'], STRINGS.persons)} />

                <Input type="select"  {...this.formFieldProps(['attr', 'contactMethod'], STRINGS.persons)}>
                    <option value="address">Post to physical address</option>
                    <option value="postalAddress">Post to postal address</option>
                    <option value="email">Email</option>
                    <option value="fax">fax</option>
                </Input>

                { isNatural &&  <Country {...this.formFieldProps(['attr','placeOfBirth'], STRINGS.persons)} /> }
                { isNatural &&  <DateInput {...this.formFieldProps(['attr','dateOfBirth'], STRINGS.persons)} /> }

            </fieldset>
        </form>
    }
}



@formFieldProps()
export class RemoveDirector extends React.Component {
    static propTypes = {

    };
    render() {
        const {fields: {reason}} = this.props;
        return <form className="form" >
            <fieldset>

                <Input {...this.formFieldProps(['person', 'name'])} type="static"/>
                <DateInput {...this.formFieldProps('cessation')} />
                <WorkingDays field={this.props.fields.noticeDate} source={this.props.fields.cessation.value} days={20} label="Notice must be given to the Registrar by" />
                <Input type="select"  {...this.formFieldProps(['reason'])} label="Reason">
                    <option value=""></option>
                    <option value="Resignation">Resignation</option>
                    <option value="Shareholders' Resolution">Shareholders' Resolution</option>
                    <option value="Disqualification">Disqualification</option>
                    <option value="Death">Death</option>
                    <option value="Court Order">Court Order</option>
                    <option value="Other">Other</option>
                </Input>

                { ['Disqualification', 'Other'].indexOf(reason.value) > -1 && <Input type="textarea" {...this.formFieldProps('reasonDetails')} label="Details"/> }
                { ['Resignation', "Shareholders' Resolution", "Court Order"].indexOf(reason.value) > -1 && <DateInput {...this.formFieldProps('reasonDate')} label="Date"/> }
                 <Documents documents={this.props.fields.documents}  label="Documents"/>
            </fieldset>
        </form>
    }
}


@formFieldProps()
export class NewDirector extends React.Component {
    static propTypes = {
        newPerson: PropTypes.func.isRequired
    };
    render() {
        const newPerson = this.props.fields.newPerson;
        const personId = this.props.fields.personId
        const person = this.props.fields.person
        const onChange = personId.onChange;

        const interceptChange =  (event) => {
            const value = event.target ? event.target.value : event.value;
            if(value === CREATE_NEW_PERSON){
                this.props.newPerson();
            }
            else{
                if(value){
                    this.props.fields.person.onChange(this.props.personMap[value]);
                }
                onChange(event);
            }
        }
        return <form className="form" >
            <fieldset>
                 { this.props.fields.appointment && <DateInput{...this.formFieldProps('appointment')} /> }

                    { !newPerson.value && <Input type="select" {...this.formFieldProps(['personId'])}  onChange={interceptChange} label={'Person'} >
                        <option></option>
                        { <option value={CREATE_NEW_PERSON}>Add new Person ➕</option>}
                        { this.props.personOptions }
                    </Input> }

                    { newPerson.value &&
                        <Input type="static" label={'New Person'} value={newPerson.value.name}
                        buttonAfter={<button className="btn btn-default" onClick={(e) => {
                            newPerson.onChange(null);
                        }}><Glyphicon glyph='trash'/></button>} /> }

                    { !newPerson.value && person.error && person.value && <div className="alert alert-danger">
                    <p>More information is required about this person.</p>
                    <div className="button-row"><Button bsStyle="danger" onClick={() => this.props.updatePerson(person.value)}>Click here to Update</Button></div>
                    </div> }

                    { !newPerson.value && !person.error && person.value &&
                    <div className="button-row"><Button bsStyle="info" onClick={() => this.props.updatePerson(person.value)}>Click here to Update Person</Button></div> }


                <WorkingDays field={this.props.fields.noticeDate} source={this.props.fields.appointment.value} days={20} label="Notice must be given to the Registrar by" />
                <DateInput {...this.formFieldProps(['approvalDate'], STRINGS.persons)} label ="Approval Date"/>

                <Input type="select"  {...this.formFieldProps('approvedBy') } label="Appointment Approved By">
                    <option value="Ordinary Resolution">Ordinary Resolution</option>
                    <option value="Other">Other</option>
                </Input>
                { this.props.fields.approvedBy.value === 'Other' && <Input type="textarea" {...this.formFieldProps('approval')} label="Approval Information"/> }

            </fieldset>
            <Documents documents={this.props.fields.documents}  label="Approval Documents"/>
        </form>
    }
}

const validateNew = requireFields('name', 'address');
const validateUpdate = requireFields('effectiveDate', 'name', 'address');

const MIN_AGE_DIRECTOR = 18;

const validateDirector = (values, props) => {
    const personErrors = validateNew(values.person);
    return {...requireFields('appointment')(values), person: personErrors};
}


const validateUpdateDirector = (values, props) => {
    // have to allow people to update existing director info without DoB etc
    return validateUpdate(values, props)
};

const birthAttributes = requireFields('dateOfBirth', 'placeOfBirth');

const contactAttributes = (values, props) => {
    const errors = {}
    if(values && values.contactMethod && values.contactMethod !== 'address'){
        if(!values[values.contactMethod]){
            errors[values.contactMethod] = ['Required.']
        }
    }
    return errors;
}

const validateNewPersonFull = (values, props) => {
    const error = validateNew(values, props)
    const attrError = {...birthAttributes(values.attr, props), ...contactAttributes(values.attr, props) };
    if(Object.keys(attrError).length){
        error.attr = attrError

    }
    return error;
}

const newDirectorRequirements = requireFields('appointment', 'approvalDate', 'approvedBy');

const validateNewDirector = (values, props) => {
    const errors = newDirectorRequirements(values, props);
    const person = values.newPerson || values.person;
    if(person){
        const personErrors = validateNewPersonFull(person);
        if(Object.keys(personErrors).length){
            errors[values.newPerson ? 'newPerson': 'person'] = personErrors
        }
        if(person.attr && person.attr.dateOfBirth && values.appointment){
            if(moment(values.appointment).diff(person.attr.dateOfBirth, 'years') < MIN_AGE_DIRECTOR){
                errors.appointment = [`Director must be at least ${MIN_AGE_DIRECTOR} years old`]
            }
        }

    }
    else{
        errors.personId = ['Required']
    }

    return errors;
}

const validateRemoveDirector = requireFields('cessation', 'reason');



const PersonFields = [
    'name', 'address', 'companyNumber',  'isNaturalPerson',
    'attr.postalAddress', 'attr.email', 'attr.fax', 'attr.phone',
    'attr.contactMethod', 'attr.placeOfBirth',  'attr.dateOfBirth'];

export const NewPersonConnected = reduxForm({
  form: 'person',
  fields: PersonFields,
  validate: validateNew,
})(Person);


export const UpdatePersonConnected = reduxForm({
  form: 'person',
  fields : ['effectiveDate'].concat(PersonFields),
  validate: validateUpdate
})(Person);


export const UpdateDirectorConnected = reduxForm({
  form: 'director',
  fields : ['effectiveDate'].concat(PersonFields),
  validate: validateUpdateDirector
})(Person);


export const NewDirectorConnected = reduxForm({
  form: 'director',
  fields : ['appointment', 'personId', 'newPerson', 'person', 'documents', 'noticeDate', 'approvedBy', 'approvalDate', 'approval'  ],
  validate: validateNewDirector,
  destroyOnUnmount: false
})(NewDirector);


export const DirectorPersonConnected = reduxForm({
  form: 'person',
  fields: PersonFields,
  validate: validateNewPersonFull,
})(Person);

export const RemoveDirectorConnected = reduxForm({
  form: 'RemoveDirector',
  fields: ['cessation','noticeDate', 'person.name',  'reason', 'reasonDetails', 'reasonDate', 'documents'],
  validate: validateRemoveDirector
})(RemoveDirector);



//Resignation", "Shareholders' Resolution", "Disqualification", "Death", "Court Order", "Other"


export function updatePersonAction(values, oldPerson){
    const action = {
        transactionType: TransactionTypes.HOLDER_CHANGE,
        afterHolder: {name: values.name, address: values.address, companyNumber: values.companyNumber, attr: {...(oldPerson.attr || {}), ...values.attr}, personId: oldPerson.personId},
        beforeHolder: {name: oldPerson.name, address: oldPerson.address, personId: oldPerson.personId, companyNumber: oldPerson.companyNumber, attr: oldPerson.attr}
    }
    return action;
}

export function updatePersonSubmit(values, oldPerson){
    return [{
        actions: [updatePersonAction(values, oldPerson)],
        effectiveDate: values.effectiveDate,
        transactionType: TransactionTypes.HOLDER_CHANGE
    }]
}

export function updateHistoricPersonAction(values, oldPerson){
    const action = {
        transactionType: TransactionTypes.HISTORIC_HOLDER_CHANGE,
        afterHolder: {name: values.name, address: values.address, companyNumber: values.companyNumber, attr: {...(oldPerson.attr || {}), ...values.attr}, personId: oldPerson.personId},
        beforeHolder: {name: oldPerson.name, address: oldPerson.address, personId: oldPerson.personId, companyNumber: oldPerson.companyNumber, attr: oldPerson.attr}
    }
    return action;
}

export function updateHistoricPersonSubmit(values, oldPerson){
    return [{
        actions: [updateHistoricPersonAction(values, oldPerson)],
        effectiveDate: values.effectiveDate,
        transactionType: TransactionTypes.HISTORIC_HOLDER_CHANGE
    }]
}


export function directorSubmit(values, oldDirector, companyState){
    let actions;
    if(!oldDirector){
        const person = populatePerson(values, companyState);
        return [{
            effectiveDate: values.appointment,
            transactionType: TransactionTypes.NEW_DIRECTOR,
            actions: [{
                transactionType: TransactionTypes.NEW_DIRECTOR,
                name: person.name,
                address: person.address,
                personId: person.personId,
                appointment: values.appointment,
                effectiveDate: values.appointment,
                noticeDate: values.noticeDate,
                personAttr: person.attr
            }]
        }]
    }
    if(values.cessation){
        return [{
            effectiveDate: values.cessation,
            transactionType: TransactionTypes.REMOVE_DIRECTOR,
            actions: [{
                transactionType: TransactionTypes.REMOVE_DIRECTOR,
                name: values.person.name,
                address: values.person.address,
                personId: oldDirector.person.personId,
                effectiveDate: values.cessation,
                noticeDate: values.noticeDate,
                personAttr: {...(oldDirector.person.attr || {}), ...values.person.attr}
            }]
        }]
    }
    else{
        return [{
            effectiveDate: values.effectiveDate,
            transactionType: TransactionTypes.UPDATE_DIRECTOR,
            actions: [{
                transactionType: TransactionTypes.UPDATE_DIRECTOR,
                beforeName: oldDirector.person.name,
                afterName: values.name,
                beforeAddress: oldDirector.person.address,
                afterAddress: values.address,
                personId: oldDirector.person.personId,
                noticeDate: values.noticeDate,
                personAttr: {...(oldDirector.person.attr || {}), ...values.attr}
            }]
        }]
    }
}