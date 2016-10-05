import React, {PropTypes} from 'react';
import Address from './address';
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


@formFieldProps()
export class Person extends React.Component {
    static propTypes = {

    };
    render() {
        return <form className="form" >
            <fieldset>
                { this.props.fields.effectiveDate && <DateInput{...this.formFieldProps('effectiveDate')} /> }
                <PersonName {...this.formFieldProps('name')} />
                <Address {...this.formFieldProps('address')} />
            </fieldset>
        </form>
    }
}

@formFieldProps()
export class Director extends React.Component {
    static propTypes = {

    };
    render() {
        return <form className="form" >
            <fieldset>
                { this.props.fields.appointment && <DateInput {...this.formFieldProps('appointment')} /> }
                { this.props.fields.cessation && <DateInput {...this.formFieldProps('cessation')} description="Setting cessation date will end this directorship."/> }
                <PersonName {...this.formFieldProps(['person', 'name'])} />
                <Address {...this.formFieldProps(['person', 'address'])} />
            </fieldset>
            <Documents documents={this.props.fields.documents}/>
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
        return <form className="form" >
            <fieldset>
                 { this.props.fields.appointment && <DateInput{...this.formFieldProps('appointment')} /> }
                { !newPerson.value && <Input type="select" {...this.formFieldProps('personId')} label={'Current Person'} >
                    <option></option>
                    { this.props.personOptions }
                </Input> }

                { !newPerson.value &&
                <div className="button-row"><ButtonInput onClick={() => {
                    this.props.newPerson;
                }}>Create New Person</ButtonInput></div> }

                { newPerson.value  &&
                    <StaticField type="static" label={'New Person'} value={newPerson.value.name}
                    buttonAfter={<button className="btn btn-default" onClick={(e) => {
                        newPerson.onChange(null);
                    }}><Glyphicon glyph='trash'/></button>} /> }

            </fieldset>
            <Documents documents={this.props.fields.documents}/>
        </form>
    }
}

const validateNew = requireFields('name', 'address');
const validateUpdate = requireFields('effectiveDate', 'name', 'address');
const validateDirector = (values, props) => {
    return {...requireFields('appointment')(values), person: requireFields('name', 'address')(values.person)};
}
const validateNewDirector = (values, props) => {
    return {...requireFields('appointment')(values), 'personId': (!values.personId && !values.newPerson) && ['Required.']};
}


export const NewPersonConnected = reduxForm({
  form: 'person',
  fields: ['name', 'address'],
  validate: validateNew
})(Person);


export const UpdatePersonConnected = reduxForm({
  form: 'person',
  fields : ['effectiveDate', 'name', 'address'],
  validate: validateUpdate
})(Person);

export const DirectorConnected = reduxForm({
  form: 'director',
  fields : ['appointment', 'cessation', 'person.name', 'person.address', 'documents'],
  validate: validateDirector
})(Director);

export const NewDirectorConnected = reduxForm({
  form: 'director',
  fields : ['appointment', 'personId', 'newPerson', 'documents'],
  validate: validateNewDirector
})(NewDirector);

export function updatePersonAction(values, oldPerson){
    const action = {
        transactionType: TransactionTypes.HOLDER_CHANGE,
        afterHolder: {name: values.name, address: values.address, companyNumber: oldPerson.companyNumber},
        beforeHolder: {name: oldPerson.name, address: oldPerson.address, personId: oldPerson.personId, companyNumber: oldPerson.companyNumber}
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
        afterHolder: {name: values.name, address: values.address, companyNumber: oldPerson.companyNumber},
        beforeHolder: {name: oldPerson.name, address: oldPerson.address, personId: oldPerson.personId, companyNumber: oldPerson.companyNumber}
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
            actions: [{
                transactionType: TransactionTypes.NEW_DIRECTOR,
                name: person.name,
                address: person.address,
                personId: person.personId,
                appointment: values.appointment
            }]
        }]
    }
    if(values.cessation){
        return [{
            effectiveDate: values.cessation,
            actions: [{
                transactionType: TransactionTypes.REMOVE_DIRECTOR,
                name: values.person.name,
                address: values.person.address,
                personId: oldDirector.person.personId
            }]
        }]
    }
    else{
        return [{
            effectiveDate: new Date(),
            actions: [{
                transactionType: TransactionTypes.UPDATE_DIRECTOR,
                beforeName: oldDirector.person.name,
                afterName: values.person.name,
                beforeAddress: oldDirector.person.address,
                afterAddress: values.person.address,
                appointment: values.appointment,
                personId: oldDirector.person.personId
            }]
        }]
    }
}