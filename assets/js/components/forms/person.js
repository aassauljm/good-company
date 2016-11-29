import React, {PropTypes} from 'react';
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
import Glyphicon from 'react-bootstrap/lib/Glyphicon'
import Button from 'react-bootstrap/lib/Button'


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
export class Director extends React.Component {
    static propTypes = {

    };
    render() {
        return <form className="form" >
            <fieldset>
                { this.props.fields.appointment && <DateInput {...this.formFieldProps('appointment')} /> }

                <PersonName {...this.formFieldProps(['person', 'name'])} />
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
                        { this.props.personOptions }
                        { <option value={CREATE_NEW_PERSON}>Create new Person</option>}
                    </Input> }

                    { newPerson.value &&
                        <Input type="static" label={'New Person'} value={newPerson.value.name}
                        buttonAfter={<button className="btn btn-default" onClick={(e) => {
                            newPerson.onChange(null);
                        }}><Glyphicon glyph='trash'/></button>} /> }

                    { !newPerson.value && person.error && <div className="alert alert-danger">
                    <p>More information is required about this person.</p>
                    <div className="button-row"><Button bsStyle="danger" onClick={() => this.props.updatePerson(person.value)}>Click here to Update</Button></div>
                    </div> }
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
    return {}
};

const birthAttributes = requireFields('dateOfBirth', 'placeOfBirth');
const validateNewPersonFull = (values, props) => {
    const error = validateNew(values, props)
    const attrError = {...birthAttributes(values.attr, props) };
    if(Object.keys(attrError).length){
        error.attr = attrError
    }
    return error;
}

const newDirectorRequirements = requireFields('appointment', 'approvalDate', 'approvedBy');

const validateNewDirector = (values, props) => {
    const errors = newDirectorRequirements(values, props);

    if(values.person){
        const personErrors = validateNewPersonFull(values.person);
        if(Object.keys(personErrors).length){
            errors.person = personErrors
        }
    }
    return errors;;
}


const PersonFields = ['name', 'address', 'companyNumber',  'isNaturalPerson', 'attr.postalAddress', 'attr.email', 'attr.fax', 'attr.phone', 'attr.contactMethod', 'attr.placeOfBirth',  'attr.dateOfBirth'];


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
            actions: [{
                transactionType: TransactionTypes.NEW_DIRECTOR,
                name: person.name,
                address: person.address,
                personId: person.personId,
                appointment: values.appointment,
                effectiveDate: values.appointment,
                noticeDate: values.noticeDate,
                personAttr: values.person.attr
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
                personId: oldDirector.person.personId,
                effectiveDate: values.cessation,
                noticeDate: values.noticeDate,
                personAttr: {...(oldDirector.person.attr || {}), ...values.person.attr}
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
                personId: oldDirector.person.personId,
                noticeDate: values.noticeDate,
                personAttr: {...(oldDirector.person.attr || {}), ...values.person.attr}
            }]
        }]
    }
}