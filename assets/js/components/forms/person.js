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
                    <option value="physical">Post to physical address</option>
                    <option value="postal">Post to postal address</option>
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
                { this.props.fields.cessation && <DateInput {...this.formFieldProps('cessation')} description="Setting cessation date will end this directorship."/> }
                <PersonName {...this.formFieldProps(['person', 'name'])} />
                <Address {...this.formFieldProps(['person', 'address'])} />
                <DateInput {...this.formFieldProps(['person', 'attr', 'dateOfBirth'], STRINGS.persons)} />
                <Country {...this.formFieldProps(['person', 'attr','placeOfBirth'], STRINGS.persons)} />
            </fieldset>
            <Documents documents={this.props.fields.documents} label="Approval Documents"/>
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
        const onChange = personId.onChange;
        const interceptChange =  (event) => {
            const value = event.target ? event.target.value : event.value;
            if(value === CREATE_NEW_PERSON){
                this.props.newPerson();
            }
            else{
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


                <DateInput {...this.formFieldProps(['person', 'attr', 'dateOfBirth'], STRINGS.persons)} />
                <Country {...this.formFieldProps(['person', 'attr','placeOfBirth'], STRINGS.persons)} />
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

const personAttributes = requireFields('dateOfBirth', 'placeOfBirth');
const newDirectorRequirements = requireFields('appointment', 'approvalDate', 'approvedBy');


const validateNewDirector = (values, props) => {
    const personAttrErrors = personAttributes(values.person.attr)
    if(values.person.attr.dateOfBirth && values.appointment &&  moment(values.appointment).diff(values.person.attr.dateOfBirth, 'years') < MIN_AGE_DIRECTOR){
        personAttrErrors.dateOfBirth = [`Director must be at least ${MIN_AGE_DIRECTOR} years of age`];
    }
    return {...newDirectorRequirements(values), 'personId': (!values.personId && !values.newPerson) && ['Required.'],
        person: {attr: personAttrErrors}
    };
}


export const NewPersonConnected = reduxForm({
  form: 'person',
  fields: ['name', 'address', 'companyNumber',  'attr.isNaturalPerson', 'attr.postalAddress', 'attr.email', 'attr.fax', 'attr.phone', 'attr.contactMethod', 'attr.placeOfBirth',  'attr.dateOfBirth'],
  validate: validateNew
})(Person);


export const UpdatePersonConnected = reduxForm({
  form: 'person',
  fields : ['effectiveDate', 'name', 'address', 'attr.isNaturalPerson', 'companyNumber', 'attr.postalAddress', 'attr.email', 'attr.fax', 'attr.phone', 'attr.contactMethod', 'attr.placeOfBirth',  'attr.dateOfBirth'],
  validate: validateUpdate
})(Person);

export const DirectorConnected = reduxForm({
  form: 'director',
  fields : ['appointment', 'cessation', 'person.name', 'person.address', 'documents', 'person.attr.dateOfBirth', 'person.attr.placeOfBirth', 'noticeDate', 'approvedBy', 'approvalDate', 'approval' ],
  validate: validateDirector
})(Director);

export const NewDirectorConnected = reduxForm({
  form: 'director',
  fields : ['appointment', 'personId', 'newPerson', 'documents', 'person.attr.dateOfBirth', 'person.attr.placeOfBirth',  'noticeDate', 'approvedBy', 'approvalDate', 'approval'  ],
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
                personAttr: values.attr
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