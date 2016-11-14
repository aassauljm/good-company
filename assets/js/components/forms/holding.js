"use strict";
import React from 'react';
import Input from '../forms/input';
import ButtonInput from '../forms/buttonInput';
import { formFieldProps, newHoldingString, populatePerson } from '../../utils';
import { ParcelWithRemove } from './parcel';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import STRINGS from '../../strings';
import { reduxForm } from 'redux-form';
import DateInput from './dateInput';
import { Documents } from './documents';
import Panel from '../panel';
import { enums as TransactionTypes } from '../../../../config/enums/transactions';
import StaticField from './staticField';

const CREATE_NEW_SHAREHOLDING = 'create-new';
const CREATE_NEW_PERSON = 'create-new';


@formFieldProps()
export class HoldingWithRemove extends React.Component {

    renderHoldingSelect() {
        const onChange = this.props.fields.holding.onChange;
        const interceptChange =  (event) => {
            if(event.target.value === CREATE_NEW_SHAREHOLDING){
                this.props.showNewHolding()
            }
            else{
                onChange(event);
            }
        }
        return <Input type="select" {...this.formFieldProps('holding')} onChange={interceptChange} label={''}>
                        <option></option>
                        { this.props.holdingOptions }
                        { this.props.showNewHolding && <option value={CREATE_NEW_SHAREHOLDING}>Create new Shareholding</option>}
                    </Input>
    }


    render() {
        const hasNew = this.props.fields.newHolding && this.props.fields.newHolding.value;
        return  <div className=" col-xs-12"><Panel remove={() => this.props.remove()} title={this.props.title || "Shareholders"}>
            <div className="holding">
                <div className=" col-xs-12">

                    { !hasNew && this.renderHoldingSelect()  }

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
    'persons[].votingShareholder',
    'documents'
]


@formFieldProps()
export class HoldingNoParcels extends React.Component {
    static propTypes = {

    };

    warnings(values) {
        if(!this.props.holding){
            return false;
        }
        var hasChanged = holdersChanged(values, this.props.holding);
        return hasChanged && <div className="alert alert-warning">
            Changing shareholders will result in a transfer to a new share allocation
        </div>
    }

    render() {
        return <form className="form" >
        <fieldset>
            <DateInput {...this.formFieldProps([ 'effectiveDate'])} />
            <Input type='text' {...this.formFieldProps([ 'holdingName'])} />
            { this.props.fields.persons.map((p, i) =>{

                const onChange = p.onChange;
                const interceptChange =  (event) => {
                    if(event.target.value === CREATE_NEW_PERSON){
                        this.props.showModal('newPerson', i);
                    }
                    else{
                        onChange(event);
                    }
                }


                return <div className="row " key={i}>
                <div className="col-full-h">
                    <div className="col-xs-9 left">
                        {  <Input type="checkbox" {...this.formFieldProps(['persons', i, 'votingShareholder'])} label={'Voting Shareholder'} >
                        </Input> }

                        { !p.newPerson.value && <Input type="select" {...this.formFieldProps(['persons', i, 'personId'])}  onChange={interceptChange} label={'Current Shareholder'} >
                            <option></option>
                            { this.props.personOptions }
                            { !p.newPerson.value && !p.personId.value && <option value={CREATE_NEW_PERSON}>Create new Person</option>}
                        </Input> }

                       {/*} { !p.newPerson.value && !p.personId.value &&
                        <div className="button-row"><ButtonInput className="new-person" onClick={() => {
                            this.props.showModal('newPerson', i);
                        }}>Create New Person</ButtonInput></div> } */ }

                    { p.newPerson.value &&
                        <Input type="static" label={'New Shareholder'} value={p.newPerson.value.name}
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
        { this.warnings(this.props.values)  }

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
            errors.personId = (errors.personId || []).concat(['Person already included'])
        }
        personId.push(p.personId);
        if(!p.personId && !p.newPerson){
            errors.personId = (errors.personId || []).concat(['Required'])
        }
        errors.votingShareholder = p.votingShareholder && values.persons.reduce((acc, p) => {
            return acc + (p.votingShareholder ? 1 : 0)
        }, 0) > 1 ? ['Only one Voting Shareholder allowed'] : null;
        return errors;
    });
    if(!values.persons.length){
        errors._error = (errors._error || []).concat(['At least 1 holder required']);
    }
    else if(values.persons.length > 1 && values.persons.reduce((acc, p) => acc + (p.votingShareholder ? 1 : 0), 0) !== 1){
        errors._error = (errors._error || []).concat(['Please select a voting shareholder']);
    };
    return errors;

}

export function holdersChanged(values, oldHolding){
    let newPerson = false;
    const existing = oldHolding.holders.map((p) => p.person.personId.toString());
    const matches = values.persons.every(p => {
        return existing.indexOf(p.personId) >= 0;
    })
    return !matches || existing.length !== values.persons.length;
}


export function reformatPersons(values, companyState){
    return values.persons.map(p => populatePerson(p, companyState));
}

export function newHoldingFormatAction(values){
    const action = {
        transactionType: TransactionTypes.NEW_ALLOCATION,
        holders: values.persons,
        name: values.holdingName
    }
    return action;
}

export function updateHoldingFormatAction(values, oldHolding, beforeHolders){
    // if only changing meta data, then HOLDING_CHANGE

    const action = {
        transactionType: TransactionTypes.HOLDING_CHANGE,
        afterHolders: values.persons,
        beforeHolders: beforeHolders,
        afterName: values.holdingName,
        beforeName: oldHolding.name,
        holdingId: oldHolding.holdingId,
        afterVotingShareholder: values.votingShareholder,
        beforeVotingShareholder: values.previousVotingShareholder,
    }
    return action;
}

export function holdingTransferFormatAction(values, oldHolding, beforeHolders){
    const action = {
        transactionType: TransactionTypes.HOLDING_TRANSFER,
        afterHolders: values.persons,
        beforeHolders: beforeHolders,
        afterName: values.holdingName,
        beforeName: oldHolding.name,
        holdingId: oldHolding.holdingId,
        afterVotingShareholder: values.votingShareholder,
        beforeVotingShareholder: values.previousVotingShareholder,
    }
    return action;
}

export function updateHoldingSubmit(values, oldHolding){
    // One or two transactions to process here.
    // first, check for holder changes
    //debugger
    const beforeHolders = oldHolding.holders.map(p =>
            ({name: p.person.name, address: p.person.address, personId: p.person.personId, companyNumber: p.person.companyNumber}));
    if(holdersChanged(values, oldHolding)){
        return [{
            transactionType: TransactionTypes.HOLDING_TRANSFER,
            effectiveDate: values.effectiveDate,
            actions: [holdingTransferFormatAction(values, oldHolding, beforeHolders)]
        },{
            transactionType: TransactionTypes.INFERRED_INTRA_ALLOCATION_TRANSFER,
            effectiveDate: values.effectiveDate,
            actions: [{
                transactionType: TransactionTypes.REMOVE_ALLOCATION,
                effectiveDate: values.effectiveDate,
                holders: beforeHolders,
            }]
        }]
    }
    return [{
        transactionType: TransactionTypes.HOLDING_CHANGE,
        effectiveDate: values.effectiveDate,
        actions: [updateHoldingFormatAction(values, oldHolding, beforeHolders)]
    }]
}



export const HoldingNoParcelsConnected = reduxForm({
  form: 'holding',
  fields,
  validate,
  destroyOnUnmount: false
})(HoldingNoParcels);
