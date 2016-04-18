"use strict";
import React from 'react';
import Input from '../forms/input';
import ButtonInput from '../forms/buttonInput';
import { formFieldProps, newHoldingString, populatePerson } from '../../utils';
import { ParcelWithRemove } from './parcel';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import STRINGS from '../../strings';
import StaticField from 'react-bootstrap/lib/FormControls/Static';
import { reduxForm } from 'redux-form';
import DateInput from './dateInput';
import { Documents } from './documents';
import Panel from '../panel';


@formFieldProps()
export class HoldingWithRemove extends React.Component {

    renderHoldingSelect() {
        return <Input type="select" {...this.formFieldProps('holding')} >
                        <option></option>
                        { this.props.holdingOptions }
                    </Input>
    }

    renderNewHolding() {
        return <div className="button-row"><ButtonInput onClick={this.props.showNewHolding}>Create New Holding</ButtonInput></div>
    }

    renderHolding() {
        if(this.props.fields.newHolding){
            return <div className="or-group">
                { this.renderHoldingSelect() }
            <span className="or-divider">- or -</span>
                { this.renderNewHolding() }
            </div>
        }
        else{
            return this.renderHoldingSelect();
        }
    }

    render() {
        const hasNew = this.props.fields.newHolding && this.props.fields.newHolding.value;
        return  <div className=" col-xs-12"><Panel remove={() => this.props.remove()} title="Recipient">
            <div className="holding">
                <div className=" col-xs-12">

                    { !hasNew && this.renderHolding(hasNew) }

                    { hasNew  &&
                        <StaticField type="static"  value={newHoldingString(this.props.fields.newHolding.value)}
                        buttonAfter={<button className="btn btn-default" onClick={(e) => {
                            e.preventDefault();
                            this.props.fields.newHolding.onChange(null);
                        }}><Glyphicon glyph='trash'/></button>} /> }

                    </div>
                    { this.props.fields.parcels.map((p, i) =>
                        <ParcelWithRemove key={i}
                        shareOptions={this.props.shareOptions}
                        fields={p}
                        remove={() => this.props.fields.parcels.removeField(i) } />) }

                    <div className="button-row"><ButtonInput onClick={(e) => {
                        e.preventDefault();
                        this.props.fields.parcels.addField();
                    }}>Add Parcel</ButtonInput></div>

            </div>
        </Panel>
            </div>
        }
}


export const fields = [
    'effectiveDate',
    'holdingName',
    'persons[].personId',
    'persons[].newPerson',
    'documents'
]


@formFieldProps()
export class HoldingNoParcels extends React.Component {
    static propTypes = {

    };

    render() {
        return <form className="form" >
        <fieldset>
            <DateInput {...this.formFieldProps([ 'effectiveDate'])} />
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
                            this.props.showModal('newPerson', i);
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
        { this.props.error && <div className="alert alert-danger">
            { this.props.error.map((e, i) => <span key={i}> { e } </span>) }
        </div> }
        <Documents documents={this.props.fields.documents}/>
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
    if(!values.persons.length){
        errors._error = (errors._error || []).concat(['At least 1 holder required.'])
    }
    return errors;

}

export function reformatPersons(values, companyState){
    return values.persons.map(p => populatePerson(p, companyState));
}

export function newHoldingFormatAction(values){
    const action = {
        transactionType: 'NEW_ALLOCATION',
        holders: values.persons,
        name: values.holdingName
    }
    return action;
}

export function updateHoldingFormatAction(values, oldHolding){
    const action = {
        transactionType: 'HOLDING_CHANGE',
        afterHolders: values.persons,
        beforeHolders: oldHolding.holders,
        afterName: values.holdingName,
        beforeName: oldHolding.name,
        holdingId: oldHolding.holdingId
    }
    return action;
}

export const HoldingNoParcelsConnected = reduxForm({
  form: 'holding',
  fields,
  validate,
  destroyOnUnmount: false
})(HoldingNoParcels);
