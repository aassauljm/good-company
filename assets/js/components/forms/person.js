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



const validateNew = requireFields('name', 'address');
const validateUpdate = requireFields('effectiveDate', 'name', 'address');


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