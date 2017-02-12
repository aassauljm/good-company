"use strict";
import React, { PropTypes } from 'react';
import { pureRender, stringDateToFormattedString, stringDateToFormattedStringTime, generateShareClassMap,
    renderShareClass, formFieldProps, requireFields, joinAnd, numberWithCommas, holdingOptionsFromState } from '../../../utils';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Input from '../../forms/input';
import DateInput from '../../forms/dateInput';
import { ParcelWithRemove } from '../../forms/parcel';
import { HoldingSelectWithNew, HoldingWithRemove } from '../../forms/holding';
import STRINGS from '../../../strings'
import { asyncConnect } from 'redux-connect';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import TransactionView from '../../forms/transactionView';
import { enums as ImportErrorTypes } from '../../../../../config/enums/importErrors';
import { enums as TransactionTypes } from '../../../../../config/enums/transactions';
import { Holding } from '../../shareholdings';
import { reduxForm } from 'redux-form';
import Panel from '../../panel';
import { beforeAndAfterSummary, holdingChangeSummary, renderHolders, actionAmountDirection } from './summaries'
import moment from 'moment';
import Shuffle from 'react-shuffle';
import { showContextualTransactionView } from '../../../actions';

let keyIndex = 0;

function increaseOptions(){
    return [
        <option key={1} value={TransactionTypes.ISSUE_TO}>{STRINGS.transactionVerbs[TransactionTypes.ISSUE_TO]}</option>,
         <option key={0} value={TransactionTypes.TRANSFER_TO}>{STRINGS.transactionVerbs[TransactionTypes.TRANSFER_TO]}</option>,
        <option key={3} value={TransactionTypes.CONVERSION_TO}>{STRINGS.transactionVerbs[TransactionTypes.CONVERSION_TO]}</option>
    ];
};

function decreaseOptions(){
    return [
        <option key={0} value={TransactionTypes.TRANSFER_FROM}>{STRINGS.transactionVerbs[TransactionTypes.TRANSFER_FROM]}</option>,
        <option key={2} value={TransactionTypes.REDEMPTION_FROM}>{STRINGS.transactionVerbs[TransactionTypes.REDEMPTION_FROM]}</option>,
        <option key={3} value={TransactionTypes.ACQUISITION_FROM}>{STRINGS.transactionVerbs[TransactionTypes.ACQUISITION_FROM]}</option>,
        <option key={4} value={TransactionTypes.CONSOLIDATION_FROM}>{STRINGS.transactionVerbs[TransactionTypes.CONSOLIDATION_FROM]}</option>,

        <option key={5} value={TransactionTypes.CANCELLATION_FROM}>{STRINGS.transactionVerbs[TransactionTypes.CANCELLATION_FROM]}</option>,
        <option key={6} value={TransactionTypes.PURCHASE_FROM}>{STRINGS.transactionVerbs[TransactionTypes.PURCHASE_FROM]}</option>
    ];
};

// other cancellation_from its own
//

function optionalNotification(type){
    return {
        [TransactionTypes.CANCELLATION_FROM]: true,
        [TransactionTypes.REDEMPTION_FROM]: true
    }[type]
}

function findHolding(companyState, action, existing = []){
    // same names, forget addresses for now
    function personsMatch(h1, h2){
        const h2Names = h2.map(h => h.name.toLowerCase());
        return h1.every(p => h2Names.indexOf(p.name.toLowerCase()) >= 0)
    }

    function parcelsMatch(p1, p2){
        // forget shareClass for now
        const sum1 = p1.reduce((sum, p) => sum+p.amount, 0);
        const sum2 = p2.reduce((sum, p) => sum+p.amount, 0);
        return sum1 === sum2;
    }
    return companyState.holdingList && companyState.holdingList.holdings.filter(h => {
        return personsMatch(action.afterHolders || action.holders, h.holders.map(h => h.person)) &&
                parcelsMatch(action.parcels.map(p => ({amount: p.afterAmount, shareClass: p.shareClass})), h.parcels) &&
                existing.indexOf(h) < 0
    })[0];
}


function isTransfer(type){
    return [TransactionTypes.TRANSFER_FROM, TransactionTypes.TRANSFER_TO].indexOf(type) >= 0;
}

function inverseTransfer(type){
    return type === TransactionTypes.TRANSFER_FROM ? TransactionTypes.TRANSFER_TO : TransactionTypes.TRANSFER_FROM;
}

function signedAmount(type, amount){
    if(!type){
        return amount;
    }
    if([TransactionTypes.ISSUE_TO, TransactionTypes.TRANSFER_TO, TransactionTypes.CONVERSION_TO].indexOf(type) >- 1){
        return amount;
    }
    return Number.isInteger(amount) ? -amount : 0;
}

function isIncrease(type) {
    return [TransactionTypes.ISSUE_TO,
    TransactionTypes.TRANSFER_TO,
    TransactionTypes.CONVERSION_TO].indexOf(type) > -1
}


function validTransactionType(type){
    return [
        TransactionTypes.ISSUE_TO,
        TransactionTypes.TRANSFER_TO,
        TransactionTypes.CONVERSION_TO,
        TransactionTypes.TRANSFER_FROM,
        TransactionTypes.PURCHASE_FROM,
        TransactionTypes.REDEMPTION_FROM,
        TransactionTypes.ACQUISITION_FROM,
        TransactionTypes.CONSOLIDATION_FROM,
        TransactionTypes.CANCELLATION_FROM,
        ].indexOf(type) >= 0 ? type : '';
}


@formFieldProps()
class Recipient extends React.Component {
    render(){
        const title =  `Transaction #${this.props.index+1}`;
        const options = this.props.increase ? increaseOptions() : decreaseOptions();
        const holdings = this.props.holdings;

        const renderOption = (h, i) => {
            return h.remaining ?
                <option key={i} value={h.value}>{h.label} - {numberWithCommas(Math.abs(h.remaining))} {h.remaining < 0 ? 'over allocated' : 'under allocated'}</option> :
                <option key={i} value={h.value}>{h.label} - shares balanced</option>
        }

        const disabled = !!this.props.isInverse.value || this.props.allDisabled;
        return  <Panel title={title}>
                { this.props.isInverse.value && <p>Calculated from paired Transfer</p>}

                <DateInput {...this.formFieldProps('effectiveDate')} disabled={disabled} time={true}/>
                <div className="input-row">
                    <Input type="select" {...this.formFieldProps('type')}
                    disabled={disabled}
                    label={false}>
                        <option value="" disabled></option>
                            {  this.props.increase && <optgroup label="Increases">{ increaseOptions() }</optgroup> }
                            {  this.props.increase && <optgroup label="Decreases">{ decreaseOptions() } </optgroup> }
                            {  !this.props.increase &&<optgroup label="Decreases">{ decreaseOptions() } </optgroup> }
                            {  !this.props.increase && <optgroup label="Increases">{ increaseOptions() }</optgroup> }
                    </Input>

                </div>
                <div className="row">{ this.props.parcels.map((p, i) =>{
                    const remove = this.props.parcels.length > 1 && (() => this.props.parcels.removeField(i));
                    const add = this.props.parcels.length < this.props.shareOptions.length && (() => this.props.parcels.addField({}));
                    return <ParcelWithRemove key={i} {...p} shareOptions={this.props.shareOptions} add={add} remove={remove} forceShareClass={true} allDisabled={this.props.allDisabled}/>
                }) }</div>

                { false && optionalNotification(this.props.type.value) && <div className="input-row">

                    <Input type="checkbox" {...this.formFieldProps('notified', STRINGS.amend) } />
                    </div>}

                { isTransfer(this.props.type.value) &&
                    <div className="input-row">
                        <Input type="select" {...this.formFieldProps('holding')}
                            disabled={disabled}
                            label={this.props.type.value === TransactionTypes.TRANSFER_TO ? 'Transfer From' : 'Transfer To'}>
                            <option value="" disabled></option>
                            {  this.props.increase && <optgroup label="Suggested">{ holdings.filter(h => !h.increase).map(renderOption) }</optgroup> }
                            {  this.props.increase && <optgroup label="Other">{ holdings.filter(h => h.increase).map(renderOption) } </optgroup> }
                            {  !this.props.increase && <optgroup label="Suggested">{ holdings.filter(h => h.increase).map(renderOption) } </optgroup> }
                            {  !this.props.increase && <optgroup label="Other">{ holdings.filter(h => !h.increase).map(renderOption) } </optgroup> }
                        </Input>
                </div> }
        </Panel>
    }
}



function Recipients(props){

    return <div className="">
            <Shuffle>
                { props.recipients.map((r, i) => {
                    const show = !r.isInverse.value;
                    if(!show){
                        const parcels = r.parcels.map(p => `${p.amount.value} ${renderShareClass(p.shareClass.value, props.shareClassMap)}`).join(', ');
                        const title = `Transfer of ${parcels} ${isIncrease(r.type.value) ?  'from' : 'to' } ${(props.holdings.find(h => h.value === r.holding.value) || {}).label}`;
                        return <div className="list-item" key={r._keyIndex.value}>
                            <Panel title={title} />
                        </div>
                    }
                    return <div className="list-item panel-external-controls" key={r._keyIndex.value}>
                            <Recipient {...r}
                            index={i}
                            increase={props.increase}
                            allSameDirection={props.allSameDirection}
                            holdings={props.holdings}
                            remove={() => props.recipients.removeField(i)}
                            shareOptions={ props.shareOptions }
                            allDisabled={props.allDisabled}
                            >
                            </Recipient>
                            { !r.isInverse.value &&  <div className="btn-group-vertical btn-group-sm list-controls">
                                { i > 0  && <button type="button" className="btn btn-default" onClick={() => props.recipients.swapFields(i, i - 1) } disabled={props.allDisabled}><Glyphicon glyph="arrow-up" /></button> }
                                <button type="button" className="btn btn-default"onClick={() => props.recipients.removeField(i) } disabled={props.allDisabled}><Glyphicon glyph="remove" /></button>
                                { i < props.recipients.length - 1  && <button type="button" className="btn btn-default" onClick={() => props.recipients.swapFields(i, i + 1) } disabled={props.allDisabled}><Glyphicon glyph="arrow-down" /></button> }
                            </div> }
                    </div>
                }) }
            </Shuffle>

          { props.error && props.error.map((e, i) => <div key={i} className="alert alert-danger">{ e }</div>)}

            { <div className="button-row">
                <Button type="button" disabled={props.allDisabled} onClick={() => {
                    const remaining = props.data.value.parcels.reduce((sum, p) => sum + (p.afterAmount - p.beforeAmount), 0) - props.recipients.reduce((sum, r) => {
                        return sum + signedAmount(r.type.value, r.parcels.reduce((sum, p) => sum + p.amount.value, 0))
                    }, 0);
                    props.recipients.addField({
                        _keyIndex: keyIndex++, effectiveDate: props.effectiveDate,
                        parcels:[{shareClass: props.defaultShareClass, amount: Math.abs(remaining)}]
                    })    // pushes empty child field onto the end of the array
                }}>
                Add Transaction
                </Button>
             </div> }
    </div>
}


class AmendActionSummary extends React.Component {
    render() {
        return <div className="amend-summary panel panel-default">
            <div className="panel-heading">
            <div className="parcels">{ this.props.action.parcels.map((p, i) => {
                const direction = actionAmountDirection(this.props.action)
                const diffClassName = direction ? 'diff increase number': 'diff decrease number';
                return <div key={i} className="parcel-row">
                    <span className="number">{ numberWithCommas(p.afterAmount) }</span>
                    <span className={diffClassName}>{ numberWithCommas(p.amount) }</span>
                    <span className="share-class">{ renderShareClass(p.shareClass, this.props.shareClassMap) } Shares</span>
                </div>
            })}
            </div>
            <div className="original-date"><label>Original Date</label> { stringDateToFormattedStringTime(this.props.action.effectiveDate) }</div>
            <div className="holders">{ (this.props.action.afterHolders || this.props.action.holders).map(renderHolders) }</div>
        </div>
        { this.props.allDisabled && <div className="disabled-overlay"><span className="fa fa-times"/></div>}
        </div>
    }
}

class AmendOptions extends React.Component {
    renderTransfer(action, actions) {
        const holders = actions.map(a => {
            return a.afterHolders || a.holders;
        })
        return <div className="row">

        </div>
    }

    renderAfterParcels(field) {
        const parcels = field.afterParcels;
        return this.props.shareOptions.length > 1 &&
                <Panel title="Share counts after all transactions">
                    { parcels.map((p, i) =>{
                        const remove = parcels.length > 1 && (() => parcels.removeField(i));
                        const add = parcels.length < this.props.shareOptions.length && (() => parcels.addField({}));
                        return <ParcelWithRemove key={i} {...p} shareOptions={this.props.shareOptions} add={add} remove={remove} forceShareClass={true}/>
                    }) }
                </Panel>
    }

    render() {
        const { shareClassMap, fields: { actions } } = this.props;
        const amountRemaining = (holding, i) => {
            const remaining = holding.parcels.reduce((sum, p) => sum + (p.afterAmount - p.beforeAmount), 0) - this.props.values.actions[i].recipients.reduce((sum, a) => {
                return sum + (a.type ? signedAmount(a.type, a.parcels.reduce((sum, p) => sum + (parseInt(p.amount, 10) || 0), 0)) : 0)
            }, 0);
            return {...holding, remaining: remaining}
        }
        const getError = (index) => {
            return this.props.error && this.props.error.actions && this.props.error.actions[index];
        }
        const holdings = this.props.values.actions.map((r, i) => {
            const a = r.data;
            const increase = actionAmountDirection(a);
            const names = joinAnd(a.holders || a.afterHolders, {prop: 'name'});
            return {value: `${i}`, label: `#${i+1} - ${names}`, increase: increase, index: i, parcels: a.parcels};
        });

        return <form onSubmit={this.props.handleSubmit}>
            <div className="button-row">
            <Button onClick={this.props.cancel} bsStyle="default">Cancel</Button>
                <Button  onClick={this.props.resetForm}>Reset</Button>
                <Button type="submit" bsStyle="primary" disabled={!this.props.valid }>Submit</Button>
            </div>
            <hr/>
            { actions.map((field, i) => {
                const action = field.data.value;
                const increase = actionAmountDirection(action);
                let className = "row ";
                const allDisabled = field.userSkip.value;
                if(allDisabled){
                    className += 'disabled ';
                }
                return <div  key={i} >
                    <div className={className}>
                        <div className="col-md-6">
                            <AmendActionSummary action={action} shareClassMap={this.props.shareClassMap} companyState={this.props.companyState } allDisabled={allDisabled}/>
                            { this.renderAfterParcels(field) }
                              <div className="button-row">
                                    { !field.userSkip.value && <Button bsStyle="danger" onClick={() => field.userSkip.onChange(!field.userSkip.value) }>Ignore Transaction</Button> }
                                    { field.userSkip.value && <Button bsStyle="info" onClick={() => field.userSkip.onChange(!field.userSkip.value) }>Reinstate Transaction</Button> }
                              </div>

                        </div>
                        <div className="col-md-6">

                            { !allDisabled && <Recipients
                                allDisabled={allDisabled}
                                effectiveDate={this.props.effectiveDate}
                                recipients={actions[i].recipients}
                                data={actions[i].data}
                                increase={increase}
                                error={getError(i)}
                                shareClassMap={shareClassMap}
                                shareOptions={this.props.shareOptions}
                                defaultShareClass={this.props.defaultShareClass}
                                holdings={holdings.map(amountRemaining).filter(h => h.index !== i)} /> }
                             { allDisabled && <div className="alert alert-warning">
                                Ignoring this transaction may result in subsequent mismatches with the Companies Register documents.
                             </div> }
                        </div>
                    </div>
                    <hr/>
                </div>
            }) }

            <div className="button-row">
                <Button bsStyle="info" onClick={() => {
                    this.props.destroyReduxForm('selectCreateHoldingChange');
                    this.props.show('selectCreateHoldingChange', {
                        ...this.props.transactionViewData,
                         formName: 'amend',
                         field: `actions[${actions.length}].data`,
                         noEffectiveDate: true,
                         afterClose: { // open this transactionView again
                             showTransactionView: {key: this.props.viewName, data: {...this.props.transactionViewData}}
                         }
                     })}}>Add Shareholding</Button>
            </div>
             <div className="button-row">
             <Button onClick={this.props.cancel} bsStyle="default">Cancel</Button>
             <Button onClick={this.props.resetForm}>Reset</Button>
                <Button type="submit" bsStyle="primary" disabled={!this.props.valid }>Submit</Button>
            </div>
        </form>
    }
}


export function validateAmend(values, props) {
    const errors = {};
    const formErrors = {};
    errors.actions = values.actions.map((action, i) => {
        const errors = {};
        if(action.userSkip){
            return errors;
        }
        const expectedSum = action.data.parcels.reduce((sum, p) => sum + (p.afterAmount - p.beforeAmount), 0);

        const expectedAfterSum = action.data.parcels.reduce((sum, p) => sum + (p.afterAmount), 0);
        const inferAmount = action.data ? action.data.inferAmount: false;
        const amounts = (action.afterParcels || []).reduce((acc, parcel) => {
            acc[parcel.shareClass || null] = {amount: parseInt(parcel.amount, 10) || 0, sum: 0}
            return acc;
        }, {[null]: {amount: expectedAfterSum, sum: 0}});

        let totalSum = 0;

        const shareClassExists = {};
        let afterParcelSum = 0;
        errors.afterParcels = (action.afterParcels || []).map((p, i) => {
            const errors = {};
            if(!p.shareClass){
                errors.shareClass = ['Required.']
            }
            if(shareClassExists[p.shareClass]){
                errors.shareClass = ['Duplicate Share Class.']
            }
            afterParcelSum += parseInt(p.amount, 10) || 0;
            let diff = afterParcelSum - expectedAfterSum
            if(diff > 0){
                errors.amount = [`${numberWithCommas(diff)} shares over allocated.`]
            }
            else if(diff < 0 && i === action.afterParcels.length-1){
                errors.amount = [`${numberWithCommas(-diff)} shares under allocated.`]
            }
            shareClassExists[p.shareClass] = true;
            return errors;
        })

        // must go in newest to oldest, to reverse twice
        errors.recipients = action.recipients.slice(0).reverse().map((recipient, j) => {
            const errors = {parcels: []};
            const inferred = recipient.parcels.length === 1 && recipient.parcels[0].amount === 'All';

            const actionAmounts = recipient.parcels.reduce((acc, parcel, i) => {
                errors.parcels[i] = {};
                if(acc[parcel.shareClass || null] !== undefined){
                    errors.parcels[i].shareClass = ['Duplicate Share Class.']
                }
                const amount = parseInt(parcel.amount, 10) || 0;
                if(!amount && !inferred){
                    errors.parcels[i].amount = ['Required.']
                }
                else if(amount <= 0 && !inferred){
                    errors.parcels[i].amount = ['Must be greater than 0.'];
                }
                const sourceParcel = (amounts[parcel.shareClass] || amounts[null]);

                if(recipient.type){
                    const absAmount = signedAmount(recipient.type, amount)
                    sourceParcel.sum += absAmount;
                    totalSum += absAmount;
                }
                if((sourceParcel.amount - sourceParcel.sum ) < 0){
                    errors.parcels[i].amount = ['Share count for this class goes below 0.'];
                }

                acc[parcel.shareClass || null] = amount;
                return acc;
            }, {});

            if(!recipient.effectiveDate){
                errors.effectiveDate = ['Required.'];
            }
            if(props.effectiveDate && recipient.effectiveDate && recipient.effectiveDate > props.effectiveDate){
                errors.effectiveDate = ['Effective date must be on or before the date of the document.'];
            }
            if(j < action.recipients.length-1 && recipient.effectiveDate < action.recipients[j+1].effectiveDate){
                errors.effectiveDate = errors.effectiveDate || [];
                errors.effectiveDate.push('Effective date cannot be before previous transaction.')
            }

            if(!recipient.type){
                errors.type = ['Required.'];
            }
            if(isTransfer(recipient.type)){
                if(!recipient.holding){
                    errors.holding = ['Transfer shareholding required.'];
                }
            }
            return errors;
        }).reverse();

        if(!action.recipients.length){
            formErrors.actions = formErrors.actions || [];
            formErrors.actions[i] = ['At least 1 transaction required.'];
        }

        if(!inferAmount && totalSum !== expectedSum){
            const diff = totalSum - expectedSum;
            formErrors.actions = formErrors.actions || [];
            if(diff < 0){
                formErrors.actions[i] = formErrors.actions[i] || [];
                formErrors.actions[i].push(`${numberWithCommas(-diff)} shares left to allocate.`);
            }
            else if(diff > 0){
                formErrors.actions[i] = formErrors.actions[i] || [];
                formErrors.actions[i].push(`${numberWithCommas(diff)} shares over allocated.`);
            }
        }

        return errors;
    });

    errors._error = Object.keys(formErrors).length ? formErrors: null;
    return errors;
}

const amendFields = [
    'actions[].recipients[].type',
    'actions[].recipients[].parcels[].amount',
    'actions[].recipients[].parcels[].shareClass',
    'actions[].recipients[].parcels[].beforeAmount',
    'actions[].recipients[].parcels[].afterAmount',
    'actions[].recipients[].effectiveDate',
    'actions[].recipients[].holding',
    'actions[].recipients[].isInverse',
    'actions[].recipients[].inverse',
    'actions[].recipients[].notified',
    'actions[].recipients[]._keyIndex',
    'actions[].data',
    'actions[].afterParcels[].amount',
    'actions[].afterParcels[].shareClass',
    'actions[].userSkip'
];

const AmendOptionsConnected = reduxForm({
    fields: amendFields,
    form: 'amend',
    validate: validateAmend,
    destroyOnUnmount: false
})(AmendOptions);


const isAmendable = (action) => [TransactionTypes.AMEND, TransactionTypes.NEW_ALLOCATION].indexOf(action.transactionMethod || action.transactionType) >= 0; // && !action.inferAmount;

export function collectAmendActions(actions){ return  actions.filter(isAmendable) };


export function formatSubmit(values, actionSet) {
    actionSet = actionSet || {data: {actions: []}};
    const amendActions = collectAmendActions(actionSet.data.actions);
    const amends = [...(values.actions.map(a => ({...a.data})))];
    const otherActions = actionSet.data.actions.filter(a => !isAmendable(a))
    const pendingActions = [{id: actionSet.id, data: {...actionSet.data, actions: otherActions}, previous_id: actionSet.previous_id}];

    const nonTransfers = {};
    const transfers = []

    values.actions.map((a, i) => {

        !a.userSkip && a.recipients.map((r, j) => {
            if(!r.isInverse){
                let method = TransactionTypes.AMEND;
                const parcels = r.parcels.map(p => ({amount: parseInt(p.amount, 10), shareClass: parseInt(p.shareClass, 10) || null}))
                const holders = amends[i].afterHolders || amends[i].holders;
                if(isTransfer(r.type)){
                    const result = {...amends[i], beforeHolders: holders, afterHolders: holders, transactionType: r.type,
                        transactionMethod: method, parcels, effectiveDate: r.effectiveDate, _holding: i, userConfirmed: true};
                    const holdingIndex = parseInt(r.holding, 10);
                    const inverseHolders = amends[holdingIndex].afterHolders || amends[holdingIndex].holders;
                    const inverse = {...amends[holdingIndex], beforeHolders: inverseHolders, afterHolders: inverseHolders,
                        transactionType: inverseTransfer(r.type), parcels, transactionMethod: method, effectiveDate: r.effectiveDate, _holding: holdingIndex, userConfirmed: true}
                    transfers.push([result, inverse])
                }
                else{
                    const result = {...amends[i], beforeHolders: holders, afterHolders: holders, transactionType: r.type,
                        transactionMethod: method, parcels, effectiveDate: r.effectiveDate, _holding: i, userConfirmed: true};
                    nonTransfers[r.effectiveDate] = nonTransfers[r.effectiveDate] || [];
                    nonTransfers[r.effectiveDate].push(result);
                    if(optionalNotification(r.type) && !r.notified){
                        if(r.type === TransactionTypes.CANCELLATION_FROM){
                            nonTransfers[r.effectiveDate].push({
                                transactionType: TransactionTypes.CANCELLATION,
                                unnotified: true,
                                parcels,
                                effectiveDate: r.effectiveDate,
                            });
                        }
                    }
                }
            }
        });
    });

    const transactions = transfers;

    Object.keys(nonTransfers).map(date => {
        transactions.push(nonTransfers[date]);
    });

    // sort by date
    transactions.sort((a, b) => {
        return b[0].effectiveDate - a[0].effectiveDate
    });

    const newAllocations = {};

    const parcelIndexByClass = (parcels, shareClass) => {
        return parcels.findIndex(p =>  !p.shareClass || shareClass === p.shareClass);
    }


    transactions.map((actions, i) => {
        actions.map(action => {
            if(action._holding !== undefined && amends[action._holding].parcels){
                //look up original action
                const original = amends[action._holding];

                action.parcels = action.parcels.map(p => {
                    p = {...p}
                    const parcelIndex = parcelIndexByClass(original.parcels, p.shareClass);
                    // if share class has changed.....
                    p.afterAmount = original.parcels[parcelIndex].afterAmount;
                    p.beforeAmount = p.afterAmount + (isIncrease(action.transactionType) ? -p.amount : p.amount);
                    original.parcels[parcelIndex] = {...original.parcels[parcelIndex]}
                    original.parcels[parcelIndex].afterAmount = p.beforeAmount;
                    return p;
                });
                if(action.parcels.every(p => p.beforeAmount === 0) && (original.transactionMethod || original.transactionType) === TransactionTypes.NEW_ALLOCATION) {
                    newAllocations[action._holding] = action;
                }
                else{
                    delete action.holders;
                }
                delete action._holding;
            }
        });
    });
    // put new allocation types where needed
    Object.keys(newAllocations).map(k => {
        newAllocations[k].transactionMethod = TransactionTypes.NEW_ALLOCATION;
        delete newAllocations[k].afterHolders;
        delete newAllocations[k].beforeHolders;
    });
    transactions.map((t, orderIndex) => {
        pendingActions.push({id: actionSet.id, data: {...actionSet.data, orderIndex: orderIndex, effectiveDate: t[0].effectiveDate, totalShares: null, actions: t}, previous_id: actionSet.previous_id});
    });

    return pendingActions;
}


export function guessAmendAfterAmounts(action, defaultShareClass, companyState){
    const holding = companyState && findHolding(companyState, action);
    if(holding){
        return holding.parcels.map(parcel => ({amount: parcel.amount, shareClass: parcel.shareClass + ''}))
    }
    return action.parcels.map(parcel => ({amount: parcel.afterAmount, shareClass:  (parcel.shareClass || defaultShareClass) + ''}))
}



export function formatInitialState(amendActions, defaultDate, defaultShareClass, companyState){
    const identity = x => x;
    const allSameDirectionSum = amendActions.reduce((acc, action) => {
        return acc + (actionAmountDirection(action) ? 1 : 0)
    }, 0);

    const allSameDirection = allSameDirectionSum === 0 || allSameDirectionSum === amendActions.length;
    const allButOneIncrease = amendActions.length > 2 && !allSameDirection && allSameDirectionSum === amendActions.length -1;
    const allButOneDecrease = amendActions.length > 2 && !allSameDirection && allSameDirectionSum === 1;

    const amountValues = amendActions.reduce((acc, action, i) => {
        const dir = (action.parcels[0].afterAmount > action.parcels[0].beforeAmount || !action.beforeHolders);
        action.parcels.map(parcel => {
            acc[dir][parcel.amount] = (acc[dir][parcel.amount] || []).concat({...action, index: i});
        });
        return acc;
    }, {true: {}, false: {}});

    let initialValues = {actions: calculateReciprocals(amendActions.map((a, i) => {
        // if all same direction, set amount;
        const effectiveDate = moment(a.effectiveDate || defaultDate).toDate();
        let amount, holding;
        if(allSameDirection){
            return {
                recipients: [{parcels:  a.parcels.map(parcel => ({amount:  a.inferAmount ? 'All' : parcel.amount, shareClass: (parcel.shareClass || defaultShareClass)+''})),
                effectiveDate,  _keyIndex: keyIndex++, type: validTransactionType(a.transactionType || a.transactionMethod)}]
            };
        }
        // else if one exact opposite transaction, then set that
        const increase =  actionAmountDirection(a);
        if(a.parcels.every(p => amountValues[increase][p.amount] && amountValues[increase][p.amount].length === 1 &&
           amountValues[!increase][p.amount] && amountValues[!increase][p.amount].length === 1)){
            return {recipients: [{
                parcels:  a.parcels.map(parcel => ({amount:  a.inferAmount ? 'All' : parcel.amount, shareClass: (parcel.shareClass || defaultShareClass)+''})),
                type: increase ? TransactionTypes.TRANSFER_TO : TransactionTypes.TRANSFER_FROM,
                holding: amountValues[!increase][a.parcels[0].amount][0].index+'',
                effectiveDate,
                isInverse: !increase,
                _keyIndex: keyIndex++
            }]};
        }
        let inverse;
        if(allButOneIncrease){
            // if all but one increase, then we know the other party in the transaction
            // inverse will be created
            holding = amountValues[!increase][Object.keys(amountValues[!increase])[0]][0].index+'';
            inverse = holding && !increase;
        }

        if(allButOneDecrease){

            holding = amountValues[!increase][Object.keys(amountValues[!increase])[0]][0].index+'';
            inverse = holding && increase;
        }


        return {recipients: [{
            parcels:  a.parcels.map(parcel => ({amount:  a.inferAmount ? 'All' : parcel.amount, shareClass: (parcel.shareClass || defaultShareClass)+''})),
            type: validTransactionType(a.transactionType) , effectiveDate, _keyIndex: keyIndex++, holding, isInverse: inverse
        }]};
    }).filter(identity), identity, identity, x => false)};

    initialValues.actions = initialValues.actions.map((a, i) => ({
        ...a, data: amendActions[i], userSkip: amendActions[i].userSkip,
        afterParcels: guessAmendAfterAmounts(amendActions[i], defaultShareClass, companyState)
    }))
    return initialValues;
}


export default function Amend(props){
    const { context, submit } = props;
    const { actionSet, companyState } = context;
    const amendActions = actionSet ? collectAmendActions(actionSet.data.actions) : [];

    const totalAmount = actionSet ? actionSet.data.totalAmount : 0;
    const effectiveDate = actionSet ? moment(actionSet.data.effectiveDate).toDate() : null;
    const shareClassMap = generateShareClassMap(companyState);
    const shareClasses = ((companyState.shareClasses || {}).shareClasses || []);
    const shareOptions = shareClasses.map((s, i) => {
        return <option key={i} value={s.id}>{s.name}</option>
    });
    const defaultShareClass = shareClasses.length ? shareClasses[0].id : null;
    const handleSubmit = (values) => {
        const pendingActions = formatSubmit(values, actionSet);
        submit({
            pendingActions: pendingActions
        })
    }

    return <div className="resolve">
            <AmendOptionsConnected
            effectiveDate={effectiveDate}
            totalAmount={totalAmount}
            shareClassMap={shareClassMap}
            shareOptions={shareOptions}
            defaultShareClass={defaultShareClass}
            onSubmit={handleSubmit}
            cancel={props.cancel}
            initialValues={formatInitialState(amendActions, actionSet.data.effectiveDate, defaultShareClass, props.resolving ? companyState : {})}
            show={props.show}
            transactionViewData={props.transactionViewData}
            viewName={props.viewName}
            destroyReduxForm={props.destroyForm}
            />
        </div>
}



export function calculateReciprocals(actions, getValue=(x) => x.value, setValue=(x) => ({value: x}), getTouched=(x) => x.touched) {
    if(!actions){
        return null;
    }

    // removal all reciprocals
    actions = actions.map(action => {
        const recipients = action.recipients.filter(r => !getValue(r.isInverse));
        return {...action, recipients}
    });

    // re add them
    actions.map((action, i) => {
        (action.recipients || []).map((recipient, j) => {
            if(isTransfer(getValue(recipient.type)) && !getValue(recipient.isInverse)){
                const holding = getValue(recipient.holding);
                if(!holding){
                    return;
                }
                const holdingIndex = parseInt(holding, 10)
                // has a holding, insert inverse transaction
                const inverseType = inverseTransfer(getValue(recipient.type))
                const inverseHolding = i.toString();
                // does the reciprocal any fields that have been touched?

                /*actions[holdingIndex].recipients = actions[holdingIndex].recipients.filter(r => {
                    return r.parcels.some(p => getTouched(p.amount) || getTouched(p.shareClass)) || getTouched(r.effectiveDate) || getTouched(r.type) || getTouched(r.holding) || getValue(r.isInverse);
                });*/

                actions[holdingIndex].recipients.push({
                    effectiveDate: recipient.effectiveDate,
                    isInverse: setValue(true),
                    type: setValue(inverseType),
                    holding: setValue(inverseHolding),
                    parcels: recipient.parcels.map(p => ({amount: setValue(getValue(p.amount)), shareClass: setValue(getValue(p.shareClass))})),
                    _keyIndex: setValue('inverse-' + getValue(recipient._keyIndex))
                });

                // better sort reciprocals
                actions[holdingIndex].recipients.sort((a, b) => {
                    return getValue(a.effectiveDate) - getValue(b.effectiveDate)
                });
            }
        })
    });
    return actions;
}


