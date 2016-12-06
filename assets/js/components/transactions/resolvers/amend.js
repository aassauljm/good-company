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
        return  <Panel remove={() => this.props.remove()} title={title}>
            { this.props.isInverse.value && <p>Calculated from paired Transfer</p>}
                    <DateInput {...this.formFieldProps('effectiveDate')} />
                <div className="input-group-pair input-row">
                    <Input type="select" {...this.formFieldProps('type')}
                    disabled={!!this.props.isInverse.value}
                    onChange={(value) => {this.props.type.onChange(value);  this.props.onChange(); }}
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
                    onChange={(value) => {this.props.amount.onChange(value);  this.props.onChange(); }}
                    label={null}/>
                </div>


                { isTransfer(this.props.type.value) &&
                    <div className="input-row">
                        <Input type="select" {...this.formFieldProps('holding')}
                            onChange={(value) => {this.props.holding.onChange(value);  this.props.onChange(); }}
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
            {props.recipients.map((r, i) => {
                return <Recipient {...r} key={i}
                    index={i}
                    increase={props.increase}
                    allSameDirection={props.allSameDirection}
                    holdings={props.holdings}
                    remove={() => props.recipients.removeField(i)}
                    onChange={props.onChange(i)}/>
            }) }
          { props.error && props.error.map((e, i) => <div key={i} className="alert alert-danger">{ e }</div>)}
                <div className="button-row">
                <Button type="button" onClick={() => {
                    props.recipients.addField()    // pushes empty child field onto the end of the array
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

        const { shareClassMap, fields: {actions}, amendActions, allSameDirection } = this.props;
        const getError = (index) => {
            return this.props.error && this.props.error.actions && this.props.error.actions[index];
        }
        // curry the indices, children will populate them

        const reciprocate = (i) => (j) => () => setTimeout(() => {
            // See if this recipient is a in a transfer
            const type = this.props.values.actions[i].recipients[j].type; //safe?
            const amount = this.props.values.actions[i].recipients[j].amount; //safe?
            if(isTransfer(type)){
                const actionIndex = parseInt(this.props.values.actions[i].recipients[j].holding, 10);
                if(Number.isInteger(actionIndex)){
                    const reciprocalIndex = this.props.values.actions[actionIndex].recipients.findIndex(r => {
                        return (!r.type || isTransfer(r.type)) && (!r.holding || r.holding === i.toString());
                    });
                    if(reciprocalIndex < 0){
                        actions[actionIndex].recipients.addField({type: inverseTransfer(type), amount: amount, holding: i.toString(), isInverse: true})
                    }
                    else{
                        actions[actionIndex].recipients[reciprocalIndex].amount.onChange((amount||0).toString());
                        actions[actionIndex].recipients[reciprocalIndex].type.onChange(inverseTransfer(type));
                        actions[actionIndex].recipients[reciprocalIndex].holding.onChange(i.toString());
                        actions[actionIndex].recipients[reciprocalIndex].isInverse.onChange(true);
                    }
                }
                else{

                }
            }
            this.props.values;
        }, 0);


        return <form onSubmit={this.props.handleSubmit}>
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
                    recipients={actions[i].recipients}
                    increase={increase}
                    allSameDirection={allSameDirection}
                    error={getError(i)}
                    onChange={reciprocate(i)}
                    holdings={this.props.holdings.filter(h => h.index !== i)} />
                </div>
                <hr/>
                </div>
            }) }

            <div className="button-row">
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
        const selectedRecipients = {};
        errors.recipients = action.recipients.map((recipient, j) => {
            const errors = {};
            const amount = parseInt(recipient.amount, 10) || 0;
            if(!recipient.effectiveDate){
                errors.effectiveDate = ['Required.'];
            }
            if(recipient.effectiveDate && recipient.effectiveDate > props.effectiveDate){
                errors.effectiveDate = ['Effective date must be on or before the date of the document.'];
            }
            if(j > 0 && recipient.effectiveDate < actions.recipients[j-1].effectiveDate){
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
                    if(selectedRecipients[recipient.holding]){
                        errors.holding = ['Share allocation already specified in transaction.'];
                    }
                    selectedRecipients[recipient.holding] = true;
                }

            }
            if(recipient.type){
                sum += absoluteAmount(recipient.type, amount);
            }
            console.log(recipient.effectiveDate)
            return errors;
        });

        if(!action.recipients.length){
            formErrors.actions = formErrors.actions || [];
            formErrors.actions[i] = ['Required.'];
        }
        const amount = props.amendActions[i].afterAmount - props.amendActions[i].beforeAmount;
        if(sum !== amount){
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

        /*action.recipients.map((r, i) => {
            if(i > 0 && action.recipients[i-1].effectiveDate){

            }
        })*/

        return errors;
    });

    errors._error = Object.keys(formErrors).length ? formErrors: null;
    return errors;
}

const amendFields = [
    'actions[].recipients[].type',
    'actions[].recipients[].amount',
    'actions[].recipients[].effectiveDate',
    'actions[].recipients[].holding',
    'actions[].recipients[].isInverse',
];

const AmendOptionsConnected = reduxForm({
    fields: amendFields,
    form: 'amendAction',
    validate: validateAmend
})(AmendOptions);



export default function Amend(context, submit){
    const { actionSet, companyState, shareClassMap } = context;
    const amendActions = actionSet.data.actions.filter(a => {
        return [TransactionTypes.AMEND, TransactionTypes.NEW_ALLOCATION].indexOf(a.transactionMethod || a.transactionType) >= 0;
    });



    const handleSubmit = (values) => {
        const amends = [...(amendActions.map(a => ({...a})))];
        const otherActions = actionSet.data.actions.filter(a => [TransactionTypes.AMEND, TransactionTypes.NEW_ALLOCATION].indexOf(a.transactionType) < 0);
        const pendingActions = [{id: context.actionSet.id, data: otherActions, previous_id: context.actionSet.previous_id}];
        const transactions = {};
        const transfers = [];


        const transferMappings = values.actions.reduce((acc, v, i) => {
            v.recipients.reduce((acc, r) => {
                acc[r.holding] = acc[r.holding] || {};
                acc[r.holding][i] =  {recipient: r, amendIndex: i};
                return acc;
            }, acc)
            return acc;
        }, {})

        values.actions.map((action, i) => {
            action.recipients.map((r, j) => {
                if(r.handled){
                    return;
                }
                const amount = parseInt(r.amount, 10);
                amends[i] = {...amends[i]}

                if(amends[i].beforeAmount !== undefined){
                    const increase = isIncrease(r.type)
                    amends[i].beforeAmount = amends[i].afterAmount + (increase ? -amount : amount);
                }
                let method = TransactionTypes.AMEND;
                if(!amends[i].beforeHolders){
                    amends[i].beforeHolders = amends[i].afterHolders = amends[i].holders;
                }

                if(isTransfer(r.type)){
                    let method = amends[i].beforeAmount === 0 ? TransactionTypes.NEW_ALLOCATION : TransactionTypes.AMEND;
                    const transfer = {...amends[i], transactionType: r.type, transactionMethod: method,
                        amount: amount, index: i, recipientIndex: parseInt(r.holding, 10), };
                    // find reciprocal
                    amends[i].afterAmount = amends[i].beforeAmount;
                    const reciprocal = transferMappings[i][r.holding];
                    const reciprocalAmend = amends[reciprocal.amendIndex];
                    const increase = isIncrease(reciprocalAmend.type)
                    reciprocalAmend.beforeAmount = reciprocalAmend.afterAmount + (increase ? -amount : amount);

                    method = reciprocalAmend.beforeAmount === 0 ? TransactionTypes.NEW_ALLOCATION : TransactionTypes.AMEND;

                    const reciprocalAction = {...reciprocalAmend, transactionType: reciprocal.recipient.type, transactionMethod: method,
                        amount: amount};
                    reciprocalAmend.afterAmount = reciprocalAmend.beforeAmount;
                    reciprocal.recipient.handled = true;

                    transfers.push([transfer, reciprocalAction])

                }
                else{
                    transactions[r.type] = transactions[r.type] || [];
                    const result = {...amends[i], transactionType: r.type, transactionMethod: method,
                        amount: amount};
                    transactions[r.type].push(result);
                    amends[i].afterAmount = amends[i].beforeAmount;
                }
            })

        })
        // group each other type
        Object.keys(transactions).map(k => {
            pendingActions.push({id: context.actionSet.id, data: {...actionSet.data, totalAmount: null, actions: transactions[k]}, previous_id: context.actionSet.previous_id});
        })
        transfers.map(k => {
            pendingActions.push({id: context.actionSet.id, data: {...actionSet.data, totalAmount: null, actions: k, transactionType: TransactionTypes.TRANSFER}, previous_id: context.actionSet.previous_id});
        });
        submit({
            pendingActions: pendingActions
        })
    }


    const allSameDirectionSum = amendActions.reduce((acc, action) => {
        return acc + actionAmountDirection(action) ? 1 : 0
    }, 0);
    const allSameDirection = allSameDirectionSum === 0 || allSameDirectionSum === amendActions.length;

    const amountValues = amendActions.reduce((acc, action, i) => {
        const dir = (action.afterAmount > action.beforeAmount || !action.beforeHolders);
        acc[dir][action.amount] = (acc[dir][action.amount] || []).concat({...action, index: i});
        return acc;
    }, {true: {}, false: {}})



    let initialValues = {actions: amendActions.map((a, i) => {
        // if all same direction, set amount;
        const effectiveDate = moment(a.effectiveDate || actionSet.data.effectiveDate).startOf('day').toDate();
        let amount, holding;
        if(allSameDirection){
            return {
                recipients: [{amount:  a.amount, effectiveDate}]
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
                effectiveDate
            }]};
        }
        return {recipients: [{
            amount:  a.amount, type: validTransactionType(a.transactionType) , effectiveDate
        }]};
    })};


    const holdings = amendActions.reduce((acc, a, i) => {
        const increase = actionAmountDirection(a);
        const names = joinAnd(a.holders || a.afterHolders, {prop: 'name'});
        let values;
        values = {value: `${i}`, label: `#${i+1} - ${names}`, increase: increase, index: i};
        acc.push(values);
        return acc;
    }, [])


    return <div>

            <AmendOptionsConnected
            amendActions={amendActions}
            effectiveDate={moment(actionSet.data.effectiveDate).toDate()}
            totalAmount={actionSet.data.totalAmount}
            allSameDirection={allSameDirection}
            holdings={holdings}
            shareClassMap={shareClassMap}
            onSubmit={handleSubmit}
            initialValues={initialValues} />
        </div>
}