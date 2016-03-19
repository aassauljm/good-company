import React from 'react';
import Address from './address';
import PersonName from './personName';
import { reduxForm } from 'redux-form';
export const fields = ['name', 'address']
import { formFieldProps, requireFields } from '../../utils';
import DateInput from './dateInput';

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
                { this.props.fields.appointment && <DateInput{...this.formFieldProps('appointment')} /> }
                { this.props.edit && this.props.fields.cessation && <DateInput{...this.formFieldProps('cessation')} /> }
                <PersonName {...this.formFieldProps(['person', 'name'])} />
                <Address {...this.formFieldProps(['person', 'address'])} />
            </fieldset>
        </form>
    }
}

const validateNew = requireFields('name', 'address');
const validateUpdate = requireFields('effectiveDate', 'name', 'address');
const validateDirector = (values, props) => {
    return {...requireFields('appointment')(values), person: requireFields('name', 'address')(values.person)};
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
  fields : ['appointment', 'cessation', 'person.name', 'person.address'],
  validate: validateDirector
})(Director);

export function updatePersonAction(values, oldPerson){
    const action = {
        transactionType: 'HOLDER_CHANGE',
        afterHolder: {name: values.name, address: values.address},
        beforeHolder: {name: oldPerson.name, address: oldPerson.address, personId: oldPerson.personId}
    }
    return action;
}

export function updatePersonSubmit(values, oldPerson){
    return [{
        actions: [updatePersonAction(values, oldPerson)],
        effectiveDate: values.effectiveDate,
        transactionType: 'HOLDER_CHANGE'
    }]
}

export function directorSubmit(values, oldDirector){
    let actions;
    if(!oldDirector){
        return [{
            effectiveDate: values.appointment,
            actions: [{
                transactionType: 'NEW_DIRECTOR',
                name: values.person.name,
                address: values.person.name,
                appointment: values.appointment
            }]
        }]
    }
    if(values.cessation){
        return [{
            effectiveDate: values.cessation,
            actions: [{
                transactionType: 'REMOVE_DIRECTOR',
                name: values.person.name,
                address: values.person.name
            }]
        }]
    }
    else{
        return [{
            effectiveDate: new Date(),
            actions: [{
                transactionType: 'UPDATE_DIRECTOR',
                beforeName: oldDirector.person.name,
                afterName: values.person.name,
                beforeAddress: oldDirector.person.address,
                afterAddress: values.person.address,
                appointment: values.appointment
            }]
        }]
    }
}