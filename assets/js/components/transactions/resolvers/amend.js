"use strict";
import React, { PropTypes } from 'react';
import { pureRender, stringDateToFormattedString, stringDateToFormattedStringTime, renderShareClass, formFieldProps, requireFields, joinAnd, numberWithCommas } from '../../../utils';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Input from '../../forms/input';
import DateInput from '../../forms/dateInput';
import STRINGS from '../../../strings'
import { asyncConnect } from 'redux-connect';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import TransactionView from '../../forms/transactionView';
import { enums as ImportErrorTypes } from '../../../../../config/enums/importErrors';
import { enums as TransactionTypes } from '../../../../../config/enums/transactions';
import { Holding } from '../../shareholdings';
import { reduxForm } from 'redux-form';
import Panel from '../../panel';
import { basicSummary, sourceInfo, beforeAndAfterSummary, holdingChangeSummary, renderHolders, actionAmountDirection } from './summaries'
import moment from 'moment';
import Shuffle from 'react-shuffle';

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
        //<option key={1} value={TransactionTypes.PURCHASE_FROM}>{STRINGS.transactionVerbs[TransactionTypes.PURCHASE_FROM]}</option>,
        <option key={2} value={TransactionTypes.REDEMPTION_FROM}>{STRINGS.transactionVerbs[TransactionTypes.REDEMPTION_FROM]}</option>,
        <option key={3} value={TransactionTypes.ACQUISITION_FROM}>{STRINGS.transactionVerbs[TransactionTypes.ACQUISITION_FROM]}</option>,
        <option key={4} value={TransactionTypes.CONSOLIDATION_FROM}>{STRINGS.transactionVerbs[TransactionTypes.CONSOLIDATION_FROM]}</option>
    ];
};


function findHolding(companyState, action, existing){
    // same names, forget addresses for nwo
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

    return companyState.holdingList.holdings.filter(h => {
        return personsMatch(action.afterHolders || action.holders, h.holders) &&
                parcelsMatch([{amount: action.afterAmount || action.amount, shareClass: action.shareClass}], h.parcels) &&
                existing.indexOf(h) < 0
    })[0];
}


function isTransfer(type){
    return [TransactionTypes.TRANSFER_FROM, TransactionTypes.TRANSFER_TO].indexOf(type) >= 0;
}

function inverseTransfer(type){
    return type === TransactionTypes.TRANSFER_FROM ? TransactionTypes.TRANSFER_TO : TransactionTypes.TRANSFER_FROM;
}

function absoluteAmount(type, amount){
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
        //TransactionTypes.PURCHASE_FROM,
        TransactionTypes.REDEMPTION_FROM,
        TransactionTypes.ACQUISITION_FROM,
        TransactionTypes.CONSOLIDATION_FROM
        ].indexOf(type) >= 0 ? type : '';
}


@formFieldProps()
class Recipient extends React.Component {
    render(){
        const title =  `Transaction #${this.props.index+1}`;
        const options = this.props.increase ? increaseOptions(!this.props.allSameDirection) : decreaseOptions(!this.props.allSameDirection);
        const holdings = this.props.holdings;
        return  <Panel title={title}>
                { this.props.isInverse.value && <p>Calculated from paired Transfer</p>}

                <DateInput {...this.formFieldProps('effectiveDate')} disabled={!!this.props.isInverse.value}/>
                <div className="input-group-pair input-row">
                    <Input type="select" {...this.formFieldProps('type')}
                    disabled={!!this.props.isInverse.value}
                    label={false}>
                        <option value="" disabled></option>
                            {  this.props.increase && <optgroup label="Increases">{ increaseOptions() }</optgroup> }
                            {  this.props.increase && <optgroup label="Decreases">{ decreaseOptions() } </optgroup> }
                            {  !this.props.increase &&<optgroup label="Decreases">{ decreaseOptions() } </optgroup> }
                            {  !this.props.increase && <optgroup label="Increases">{ increaseOptions() }</optgroup> }
                    </Input>
                    <Input className="amount" type="number" {...this.formFieldProps('amount')}
                    placeholder={'Number of Shares'}
                    value={this.props.amount.value }
                    disabled={!!this.props.isInverse.value}
                    label={null}/>
                </div>


                { isTransfer(this.props.type.value) &&
                    <div className="input-row">
                        <Input type="select" {...this.formFieldProps('holding')}
                            disabled={!!this.props.isInverse.value}
                            label={this.props.type.value === TransactionTypes.TRANSFER_TO ? 'Transfer From' : 'Transfer To'}>
                            <option value="" disabled></option>
                            {  this.props.increase && <optgroup label="Suggested">{ holdings.filter(h => !h.increase).map((h, i) => <option key={i} value={h.value}>{h.label}</option>) } </optgroup> }
                            {  this.props.increase && <optgroup label="Other">{ holdings.filter(h => h.increase).map((h, i) => <option key={i} value={h.value}>{h.label}</option>) } </optgroup> }
                            {  !this.props.increase && <optgroup label="Suggested">{ holdings.filter(h => h.increase).map((h, i) => <option key={i} value={h.value}>{h.label}</option>) } </optgroup> }
                            {  !this.props.increase && <optgroup label="Other">{ holdings.filter(h => !h.increase).map((h, i) => <option key={i} value={h.value}>{h.label}</option>) } </optgroup> }
                        </Input>
                </div> }
        </Panel>
    }
}


function Recipients(props){
    return <div className="col-md-6 col-md-offset-3">
            <Shuffle>
            { props.recipients.map((r, i) => {
                const show = !r.isInverse.value;
                if(!show){
                    const title = `Transfer of ${r.amount.value || 0} ${isIncrease(r.type.value) ?  'from' : 'to' } ${props.holdings.find(h => h.value === r.holding.value).label}`;
                    return <div className="list-item" key={r._keyIndex.value}>
                        <Panel title={title} />
                    </div>
                }
                return <div className="list-item panel-external-controls" key={r._keyIndex.value}>
                        <Recipient {...r} key={i}
                        index={i}
                        increase={props.increase}
                        allSameDirection={props.allSameDirection}
                        holdings={props.holdings}
                        remove={() => props.recipients.removeField(i)}
                        >
                        </Recipient>
                        { !r.isInverse.value &&  <div className="btn-group-vertical btn-group-sm list-controls">
                            { i > 0  && <button type="button" className="btn btn-default" onClick={() => props.recipients.swapFields(i, i - 1) }><Glyphicon glyph="arrow-up" /></button> }
                            <button type="button" className="btn btn-default"onClick={() => props.recipients.removeField(i) }><Glyphicon glyph="remove" /></button>
                            { i < props.recipients.length - 1  && <button type="button" className="btn btn-default"onClick={() => props.recipients.swapFields(i, i + 1) }><Glyphicon glyph="arrow-down" /></button> }
                        </div> }
                </div>
            }) }
            </Shuffle>
          { props.error && props.error.map((e, i) => <div key={i} className="alert alert-danger">{ e }</div>)}

                <div className="button-row">
                <Button type="button" onClick={() => {
                    props.recipients.addField({_keyIndex: keyIndex++, effectiveDate: props.effectiveDate})    // pushes empty child field onto the end of the array
                }}>
                Add Transaction
                </Button>
          </div>
    </div>
}



class AmendOptions extends React.Component {
    renderTransfer(action, actions) {
        const holders = actions.map(a => {
            return a.afterHolders || a.holders;
        })
        return <div className="row">

        </div>
    }
    render() {

        const { shareClassMap, fields: { actions }, amendActions, allSameDirection } = this.props;
        const getError = (index) => {
            return this.props.error && this.props.error.actions && this.props.error.actions[index];
        }
        return <form onSubmit={this.props.handleSubmit}>
            <div className="button-row">
                <Button  onClick={this.props.resetForm}>Reset</Button>
                <Button type="submit" bsStyle="primary" disabled={!this.props.valid }>Submit</Button>
            </div>
            { actions.map((field, i) => {
                const action = amendActions[i];
                const increase = actionAmountDirection(action);
                return <div  key={i}>
                        { beforeAndAfterSummary({action: action, shareClassMap: this.props.shareClassMap}, this.props.companyState) }

                <div className="row">
                <div className="text-center">
                <p><strong>This change is comprised of:</strong></p>
                </div>
                    <Recipients
                    effectiveDate={this.props.effectiveDate}
                    recipients={actions[i].recipients}
                    increase={increase}
                    allSameDirection={allSameDirection}
                    error={getError(i)}
                    holdings={this.props.holdings.filter(h => h.index !== i)} />
                </div>
                <hr/>
                </div>
            }) }

            <div className="button-row">
             <Button onClick={this.props.resetForm}>Reset</Button>
                <Button type="submit" bsStyle="primary" disabled={!this.props.valid }>Submit</Button>
            </div>
        </form>
    }
}


const validateAmend = (values, props) => {
    const errors = {};
    const formErrors = {};
    errors.actions = values.actions.map((action, i) => {
        const errors = {};
        let sum = 0;
        //const selectedRecipients = {};
        errors.recipients = action.recipients.map((recipient, j) => {
            const errors = {};
            const amount = parseInt(recipient.amount, 10) || 0;
            if(!recipient.effectiveDate){
                errors.effectiveDate = ['Required.'];
            }
            if(recipient.effectiveDate && recipient.effectiveDate > props.effectiveDate){
                errors.effectiveDate = ['Effective date must be on or before the date of the document.'];
            }
            if(j > 0 && recipient.effectiveDate < action.recipients[j-1].effectiveDate){
                errors.effectiveDate = errors.effectiveDate || [];
                errors.effectiveDate.push('Effective date cannot be before previous transaction.')
            }
            if(!amount){
                errors.amount = ['Required.'];
            }
            else if(amount <= 0){
                errors.amount = ['Must be greater than 0.'];
            }
            if(!recipient.type){
                errors.type = ['Required.'];
            }
            if(isTransfer(recipient.type)){
                if(!recipient.holding){
                    errors.holding = ['Transfer shareholding required.'];
                }
                else{
                }

            }
            if(recipient.type){
                sum += absoluteAmount(recipient.type, amount);
            }
            return errors;
        });

        if(!action.recipients.length){
            formErrors.actions = formErrors.actions || [];
            formErrors.actions[i] = ['Required.'];
        }
        const amount = props.amendActions[i].afterAmount - props.amendActions[i].beforeAmount;
        if(!props.amendActions[i].inferAmount && sum !== amount){
            formErrors.actions = formErrors.actions || [];
            const diff = sum - amount;
            if(diff < 0){
                formErrors.actions[i] = formErrors.actions[i] || [];
                formErrors.actions[i].push(`${-diff} shares left to allocate.`);
            }
            else if(diff > 0){
                formErrors.actions[i] = formErrors.actions[i] || [];
                formErrors.actions[i].push(`${diff} shares over allocated.`);
            }
        }


        return errors;
    });

    errors._error = Object.keys(formErrors).length ? formErrors: null;
    console.log(errors)
    return errors;
}

const amendFields = [
    'actions[].recipients[].type',
    'actions[].recipients[].amount',
    'actions[].recipients[].effectiveDate',
    'actions[].recipients[].holding',
    'actions[].recipients[].isInverse',
    'actions[].recipients[].inverse',
    'actions[].recipients[]._keyIndex',
];

const AmendOptionsConnected = reduxForm({
    fields: amendFields,
    form: 'amendAction',
    validate: validateAmend
})(AmendOptions);


const isAmendable = (action) => [TransactionTypes.AMEND, TransactionTypes.NEW_ALLOCATION].indexOf(action.transactionMethod || action.transactionType) >= 0 && !action.inferAmount;

const collectAmendActions = (actions) => actions.filter(isAmendable);


export function formatSubmit(values, actionSet) {
    const amendActions = collectAmendActions(actionSet.data.actions);
    const amends = [...(amendActions.map(a => ({...a})))];
    const otherActions = actionSet.data.actions.filter(a => !isAmendable(a))
    const pendingActions = [{id: actionSet.id, data: {...actionSet.data, actions: otherActions}, previous_id: actionSet.previous_id}];

    const transactions = [];

    values.actions.map((a, i) => {
        a.recipients.map((r, j) => {
            if(!r.isInverse){
                let method = TransactionTypes.AMEND;
                const amount = parseInt(r.amount, 0);
                const holders = amends[i].afterHolders || amends[i].holders;
                if(isTransfer(r.type)){
                    const result = {...amends[i], beforeHolders: holders, afterHolders: holders, transactionType: r.type,
                        transactionMethod: method, amount: amount, effectiveDate: r.effectiveDate, _holding: i, userConfirmed: true};
                    const holdingIndex = parseInt(r.holding, 10)
                    const inverseHolders = amends[holdingIndex].afterHolders || amends[holdingIndex].holders;
                    const inverse = {...amends[holdingIndex], beforeHolders: inverseHolders, afterHolders: inverseHolders,
                        transactionType: inverseTransfer(r.type),  amount: amount, transactionMethod: method, effectiveDate: r.effectiveDate, _holding: holdingIndex}
                    transactions.push([result, inverse])
                }
                else{
                    const result = {...amends[i], beforeHolders: holders, afterHolders: holders, transactionType: r.type,
                        transactionMethod: method, amount: amount, effectiveDate: r.effectiveDate, _holding: i, userConfirmed: true};
                    transactions.push([result]);
                }
            }
        });
    });

    // sort by date
    transactions.sort((a, b) => {
        return b[0].effectiveDate - a[0].effectiveDate
    });

    const newAllocations = {};

    transactions.map((sets, i) => {
        sets.map(action => {
            //look up original action
            const original = amends[action._holding];
            action.afterAmount = amends[action._holding].afterAmount;
            action.beforeAmount = action.afterAmount + (isIncrease(action.transactionType) ? -action.amount : action.amount);
            original.afterAmount = action.beforeAmount;
            if(action.beforeAmount === 0 && (original.transactionMethod || original.transactionType) === TransactionTypes.NEW_ALLOCATION) {
                newAllocations[action._holding] = action;
            }
            else{
                delete action.holders;
            }
            delete action._holding;
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


export default function Amend(context, submit){
    const { actionSet, companyState, shareClassMap } = context;
    const amendActions = collectAmendActions(actionSet.data.actions);
    const identity = x => x;

    const handleSubmit = (values) => {
        const pendingActions = formatSubmit(values, actionSet);
        submit({
            pendingActions: pendingActions
        })
    }

    const allSameDirectionSum = amendActions.reduce((acc, action) => {
        return acc + (actionAmountDirection(action) ? 1 : 0)
    }, 0);

    const allSameDirection = allSameDirectionSum === 0 || allSameDirectionSum === amendActions.length;
    const allButOneIncrease = amendActions.length > 1 && !allSameDirection && allSameDirectionSum === amendActions.length -1;
    const allButOneDecrease = amendActions.length > 1 && !allSameDirection && allSameDirectionSum === 1;



    const amountValues = amendActions.reduce((acc, action, i) => {
        const dir = (action.afterAmount > action.beforeAmount || !action.beforeHolders);
        acc[dir][action.amount] = (acc[dir][action.amount] || []).concat({...action, index: i});
        return acc;
    }, {true: {}, false: {}});

    let initialValues = {actions: calculateReciprocals(amendActions.map((a, i) => {
        // if all same direction, set amount;
        const effectiveDate = moment(a.effectiveDate || actionSet.data.effectiveDate).startOf('day').toDate();
        let amount, holding;
        if(allSameDirection){
            return {
                recipients: [{amount:  a.amount, effectiveDate, _keyIndex: keyIndex++}]
            };
        }
        // else if one exact opposite transaction, then set that
        const increase =  actionAmountDirection(a);
        if(amountValues[increase][a.amount] && amountValues[increase][a.amount].length === 1 &&
           amountValues[!increase][a.amount] && amountValues[!increase][a.amount].length === 1){
            return {recipients: [{
                amount: a.amount,
                type: increase ? TransactionTypes.TRANSFER_TO : TransactionTypes.TRANSFER_FROM,
                holding: amountValues[!increase][a.amount][0].index+'',
                effectiveDate,
                isInverse: !increase,
                _keyIndex: keyIndex++
            }]};
        }

        if(allButOneIncrease){
            holding = amountValues[false][Object.keys(amountValues[false])[0]][0].index+'';
        }

        if(allButOneDecrease){
            holding = amountValues[true][Object.keys(amountValues[false])[0]][0].index+'';
        }

        return {recipients: [{
            amount:  a.amount, type: validTransactionType(a.transactionType) , effectiveDate, _keyIndex: keyIndex++, holding
        }]};
    }).filter(identity), identity, identity, x => false)};

    const holdings = amendActions.reduce((acc, a, i) => {
        const increase = actionAmountDirection(a);
        const names = joinAnd(a.holders || a.afterHolders, {prop: 'name'});
        let values;
        values = {value: `${i}`, label: `#${i+1} - ${names}`, increase: increase, index: i};
        acc.push(values);
        return acc;
    }, []);

    return <div>
            <AmendOptionsConnected
            amendActions={amendActions}
            effectiveDate={moment(actionSet.data.effectiveDate).startOf('day').toDate()}
            totalAmount={actionSet.data.totalAmount}
            allSameDirection={allSameDirection}
            holdings={holdings}
            shareClassMap={shareClassMap}
            onSubmit={handleSubmit}
            initialValues={initialValues} />
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
                actions[holdingIndex].recipients = actions[holdingIndex].recipients.filter(r => {
                    return getTouched(r.amount) || getTouched(r.effectiveDate) || getTouched(r.type) || getTouched(r.holding) || getValue(r.isInverse);
                });
                actions[holdingIndex].recipients.push({
                    effectiveDate: recipient.effectiveDate,
                    isInverse: setValue(true),
                    type: setValue(inverseType),
                    holding: setValue(inverseHolding),
                    amount: recipient.amount,
                    _keyIndex: setValue(keyIndex++)
                });

                // better sort reciprocals
                actions[holdingIndex].recipients.sort((a, b) => {
                    return getValue(a.effectiveDate) - getValue(b.effectiveDate)
                });
            }
        })
        return {...action}
    });
    return actions;
}


