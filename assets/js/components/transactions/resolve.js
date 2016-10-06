"use strict";
import React, { PropTypes } from 'react';
import { requestResource, updateResource, showModal, addNotification } from '../../actions';
import { pureRender, stringToDate, stringToDateTime, renderShareClass, generateShareClassMap, formFieldProps, requireFields, joinAnd, numberWithCommas } from '../../utils';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Input from '../forms/input';
import { Link } from 'react-router'
import STRINGS from '../../strings'
import { asyncConnect } from 'redux-connect';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { push } from 'react-router-redux'
import Modal from '../forms/modal';
import { enums as ImportErrorTypes } from '../../../../config/enums/importErrors';
import { enums as TransactionTypes } from '../../../../config/enums/transactions';
import HoldingTransfer from './resolvers/holdingTransfer';
import { Holding } from '../shareholdings';
import { reduxForm } from 'redux-form';
import Panel from '../panel';
import { basicSummary, sourceInfo, beforeAndAfterSummary, holdingChangeSummary, renderHolders, actionAmountDirection } from './resolvers/summaries'



function increaseOptions(includeTransfer){
    if(!includeTransfer){
        return increaseOptionsNoTransfer();
    }
    return [
        <option key={1} value={TransactionTypes.ISSUE_TO}>{STRINGS.transactionVerbs[TransactionTypes.ISSUE_TO]}</option>,
         <option key={0} value={TransactionTypes.TRANSFER_TO}>{STRINGS.transactionVerbs[TransactionTypes.TRANSFER_TO]}</option>,
        <option key={3} value={TransactionTypes.CONVERSION_TO}>{STRINGS.transactionVerbs[TransactionTypes.CONVERSION_TO]}</option>
    ];
};

function increaseOptionsNoTransfer(){
    return [
        <option key={1} value={TransactionTypes.ISSUE_TO}>{STRINGS.transactionVerbs[TransactionTypes.ISSUE_TO]}</option>,
        <option key={3} value={TransactionTypes.CONVERSION_TO}>{STRINGS.transactionVerbs[TransactionTypes.CONVERSION_TO]}</option>
    ];
};

function decreaseOptions(includeTransfer){
    if(!includeTransfer){
        return decreaseOptionsNoTransfer();
    }
    return [
        <option key={1} value={TransactionTypes.PURCHASE_FROM}>{STRINGS.transactionVerbs[TransactionTypes.PURCHASE_FROM]}</option>,
        <option key={0} value={TransactionTypes.TRANSFER_FROM}>{STRINGS.transactionVerbs[TransactionTypes.TRANSFER_FROM]}</option>,
        <option key={2} value={TransactionTypes.REDEMPTION_FROM}>{STRINGS.transactionVerbs[TransactionTypes.REDEMPTION_FROM]}</option>,
        <option key={3} value={TransactionTypes.ACQUISITION_FROM}>{STRINGS.transactionVerbs[TransactionTypes.ACQUISITION_FROM]}</option>,
        <option key={4} value={TransactionTypes.CONSOLIDATION_FROM}>{STRINGS.transactionVerbs[TransactionTypes.CONSOLIDATION_FROM]}</option>
    ];
};

function decreaseOptionsNoTransfer(){
    return [
        <option key={1} value={TransactionTypes.PURCHASE_FROM}>{STRINGS.transactionVerbs[TransactionTypes.PURCHASE_FROM]}</option>,
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

@formFieldProps()
class Recipient extends React.Component {
    render(){
        const title =  'This transaction was a:';
        const options = this.props.increase ? increaseOptions(!this.props.allSameDirection) : decreaseOptions(!this.props.allSameDirection);
        return  <Panel remove={() => this.props.remove()} title={title}>
            { this.props.isInverse.value && <p>Calculated from paired Transfer</p>}
                <div className="input-group-pair input-row">
                    <Input type="select" {...this.formFieldProps('type')}
                    disabled={!!this.props.isInverse.value}
                    onChange={(value) => {this.props.type.onChange(value);  this.props.onChange(); }}
                    label={false}>
                        <option value="" disabled></option>
                        { options }
                    </Input>
                    <Input className="amount" type="number" {...this.formFieldProps('amount')}
                    placeholder={'Number of Shares'}
                    value={this.props.amount.value }
                    disabled={!!this.props.isInverse.value}
                    onChange={(value) => {this.props.amount.onChange(value);  this.props.onChange(); }}
                    label={null}/>
                </div>
                { isTransfer(this.props.type.value) && <div className="input-row">
                    <Input type="select" {...this.formFieldProps('holding')}
                        onChange={(value) => {this.props.holding.onChange(value);  this.props.onChange(); }}
                        disabled={!!this.props.isInverse.value}
                        label={this.props.increase ? 'Transfer From' : 'Transfer To'}>
                        <option value="" disabled></option>
                        { this.props.holdings.map((h, i) => <option key={i} value={h.value}>{h.label}</option>)}
                    </Input>
                </div> }
        </Panel>
    }
}


function Recipients(props){
    return <div className="col-md-6 col-md-offset-3">
            {props.recipients.map((r, i) => {
                return <Recipient {...r} key={i}
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
                        actions[actionIndex].recipients[reciprocalIndex].amount.onChange(amount.toString());
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
                    <Recipients
                    recipients={actions[i].recipients}
                    increase={increase}
                    allSameDirection={allSameDirection}
                    error={getError(i)}
                    onChange={reciprocate(i)}
                    holdings={increase ? this.props.holdings.decreases : this.props.holdings.increases} />
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
        errors.recipients = action.recipients.map(recipient => {
            const errors = {};
            const amount = parseInt(recipient.amount, 10) || 0;

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
            sum += amount;
            return errors;
        });

        if(!action.recipients.length){
            formErrors.actions = formErrors.actions || [];
            formErrors.actions[i] = ['Required.'];
        }
        if(sum !== props.amendActions[i].amount){
            formErrors.actions = formErrors.actions || [];
            const diff = sum - props.amendActions[i].amount;
            if(diff < 0){
                formErrors.actions[i] = [`${-diff} shares left to allocate.`];
            }
            else{
                formErrors.actions[i] = [`${diff} shares over allocated.`];
            }
        }
        return errors;
    });

    errors._error = Object.keys(formErrors).length ? formErrors: null;
    return errors;
}

const amendFields = [
    'actions[].recipients[].type',
    'actions[].recipients[].amount',
    'actions[].recipients[].holding',
    'actions[].recipients[].isInverse',
];

const AmendOptionsConnected = reduxForm({
    fields: amendFields,
    form: 'amendAction',
    validate: validateAmend
})(AmendOptions);




const submitRestart = (...rest) => skipOrRestart(false, ...rest);
const submitSkipRestart = (...rest) => skipOrRestart(true, ...rest);

const DESCRIPTIONS = {
    [TransactionTypes.HOLDING_CHANGE]: holdingChangeSummary,
    [TransactionTypes.ANNUAL_RETURN]: basicSummary,
    [TransactionTypes.AMEND]:  beforeAndAfterSummary,
    [TransactionTypes.HOLDING_TRANSFER]: basicSummary,
    [TransactionTypes.NEW_ALLOCATION]: basicSummary,
    [TransactionTypes.REMOVE_ALLOCATION]: basicSummary,
    [TransactionTypes.UPDATE_DIRECTOR]: basicSummary
}

const PAGES = {
    [ImportErrorTypes.MULTIPLE_HOLDINGS_FOUND]: function(context,  submit){
        const { possibleMatches, companyState, shareClassMap } = context;
        function handleSelect(holding){
            const updatedActions = {...context.actionSet.data};
            updatedActions.actions = updatedActions.actions.map(a => {
                a = {...a};
                if(a.id === context.action.id){
                    a.holdingId = holding.holdingId;
                }
                return a;
            })
            submit({
                pendingActions: [{id: context.actionSet.id, data: updatedActions, previous_id: context.actionSet.previous_id}]
            })
        }
        return <div>
            { DESCRIPTIONS[context.action.transactionMethod](context, context.companyState) }
             <div className="row">
                <div className="col-md-12">
                <p className="instructions">Which shareholding does the result of the transaction refer to?</p>
                </div>
             </div>
             <div className="row">
             { possibleMatches.map((m, i) => <div key={i} className="col-md-6"><Holding holding={m} total={companyState.totalShares} select={handleSelect} shareClassMap={shareClassMap}/></div>) }
             </div>
        </div>
    },
    [ImportErrorTypes.HOLDING_NOT_FOUND]: submitRestart,
    [ImportErrorTypes.ANNUAL_RETURN_HOLDING_DIFFERENCE]: submitSkipRestart,
    [ImportErrorTypes.DIRECTOR_NOT_FOUND]: submitSkipRestart,
    [ImportErrorTypes.ANNUAL_RETURN_SHARE_COUNT_DIFFERENCE]: submitSkipRestart,

    [ImportErrorTypes.AMEND_TRANSFER_ORDER]: HoldingTransfer,

    [ImportErrorTypes.UNKNOWN_AMEND]: function(context, submit){
        const { actionSet, companyState, shareClassMap } = context;
        const amendActions = actionSet.data.actions.filter(a => [TransactionTypes.AMEND, TransactionTypes.NEW_ALLOCATION].indexOf(a.transactionType) >= 0);

        const holdings = {increases: [], decreases: []};
        const handleSubmit = (values) => {
            const otherActions = actionSet.data.actions.filter(a => [TransactionTypes.AMEND, TransactionTypes.NEW_ALLOCATION].indexOf(a.transactionType) < 0);
            const pendingActions = [{id: context.actionSet.id, data: otherActions, previous_id: context.actionSet.previous_id}];
            const transactions = {};
            const transfers = [];
            values.actions.map((action, i) => {
                action.recipients.map((r, j) => {
                    const amount = parseInt(r.amount, 10);
                    // TODO, this ordering might result in problems
                    if(amendActions[i].beforeAmount !== undefined){
                        const increase = actionAmountDirection(amendActions[i])
                        amendActions[i].beforeAmount = amendActions[i].afterAmount + (increase ? -amount : amount);
                    }
                    if(isTransfer(r.type)){
                        transfers.push({...amendActions[i], transactionType: r.type, transactionMethod: amendActions[i].transactionType, amount: amount, index: i, recipientIndex: parseInt(r.holding, 10)});
                    }
                    else{
                        transactions[r.type] = transactions[r.type] || [];
                        transactions[r.type].push({...amendActions[i], transactionType: r.type, transactionMethod: amendActions[i].transactionType, amount: amount});
                    }
                    if(amendActions[i].beforeAmount !== undefined){
                        amendActions[i].afterAmount = amendActions[i].beforeAmount;
                    }
                })
            })

            // group each other type
            Object.keys(transactions).map(k => {
                pendingActions.push({id: context.actionSet.id, data: {...actionSet.data, actions: transactions[k]}, previous_id: context.actionSet.previous_id});
            })
            //pair up transfers
            while(transfers.length){
                const transfer = transfers.shift();
                const reciprocalIndex = transfers.findIndex(t => {
                    return t.amount === transfer.amount && t.shareClass === transfer.shareClass && t.recipientIndex === transfer.index;
                });
                const reciprocal = transfers.splice(reciprocalIndex, 1)[0];
                pendingActions.push({
                    id: context.actionSet.id, data: {...actionSet.data, actions: [transfer, reciprocal], type: TransactionTypes.TRANSFER}, previous_id: context.actionSet.previous_id
                })
            }
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

        const initialValues = {actions: amendActions.map((a, i) => {
            // if all same direction, set amount;
            let amount, holding;
            if(allSameDirection){
                return {
                    recipients: [{amount:  a.amount}]
                };
            }
            // else if one exact opposite transaction, then set that
            const increase =  actionAmountDirection(a);
            if(amountValues[increase][a.amount] && amountValues[increase][a.amount].length === 1 &&
               amountValues[!increase][a.amount] && amountValues[!increase][a.amount].length === 1){
                return {recipients: [{
                    amount: a.amount,
                    type: increase ? TransactionTypes.TRANSFER_TO : TransactionTypes.TRANSFER_FROM,
                    holding: amountValues[!increase][a.amount][0].index
                }]};
            }
            return {recipients: [{amount:  a.amount}]};
        })};

        amendActions.map((a, i) => {
            const increase = actionAmountDirection(a);
            const names = joinAnd(a.holders || a.afterHolders, {prop: 'name'});
            if(increase){
                holdings.increases.push({value: i, label: `#${i+1} - ${names}`});
            }
            else{
                holdings.decreases.push({value: i, label: `#${i+1} - ${names}`});
            }

        })
        return <div>

                <AmendOptionsConnected
                amendActions={amendActions}
                allSameDirection={allSameDirection}
                holdings={holdings}
                shareClassMap={shareClassMap}
                onSubmit={handleSubmit}
                initialValues={initialValues} />
            </div>
    }
}




@connect((state, ownProps) => {
    return {};
}, (dispatch, ownProps) => {
    return {
        addNotification: (args) => dispatch(addNotification(args)),
        updateAction: (args) => {
            return dispatch(updateResource(`/company/${ownProps.modalData.companyId}/update_pending_history`, args, {
                invalidates: [`/company/${ownProps.modalData.companyId}/import_pending_history`]
            }))
            .then(() => {
                ownProps.end();
            })
        },
        resetAction: (args) => {
            return dispatch(updateResource(`/company/${ownProps.modalData.companyId}/reset_pending_history`, {}, {}))
            .then(() => {
                ownProps.end();
            })
        }
    }
})
export class ResolveAmbiguityModal extends React.Component {

    constructor(props){
        super(props);
    }

    renderBody() {
        const context = {message: this.props.modalData.error.message, ...this.props.modalData.error.context};
        const action = context.action;
        context.shareClassMap = generateShareClassMap(context.companyState);
        if(!action || !PAGES[context.importErrorType]){
            return <div className="resolve">
                    <div>Unknown Import Error</div>
                    <div className="button-row">
                        <Button onClick={this.props.resetAction} className="btn-danger">Restart Import</Button>
                    </div>
                </div>
        }
        return <div className="resolve">
            { basicSummary(context, this.props.modalData.companyState)}
            <hr/>
            { PAGES[context.importErrorType](context, this.props.updateAction, this.props.resetAction)}
        </div>
    }

    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Resolve Company Import Problem</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                { this.renderBody() }
              </Modal.Body>
              <Modal.Footer>
            <div className="button-row">
            <Button onClick={this.props.end} >Cancel</Button>
            </div>
              </Modal.Footer>
            </Modal>
    }
}
