"use strict";
import React, { PropTypes } from 'react';
import { requestResource, updateResource, showTransactionView, addNotification } from '../../actions';
import { pureRender, stringDateToFormattedString, stringDateToFormattedStringTime, renderShareClass, generateShareClassMap, formFieldProps, requireFields, joinAnd, numberWithCommas } from '../../utils';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Input from '../forms/input';
import { Link } from 'react-router'
import STRINGS from '../../strings'
import { asyncConnect } from 'redux-connect';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { push } from 'react-router-redux'
import TransactionView from '../forms/transactionView';
import { enums as ImportErrorTypes } from '../../../../config/enums/importErrors';
import { enums as TransactionTypes } from '../../../../config/enums/transactions';
import HoldingTransfer from './resolvers/holdingTransfer';
import Amend from './resolvers/amend';
import { DateConfirmation } from './resolvers/confirmDate';
import { Holding } from '../shareholdings';
import { reduxForm } from 'redux-form';
import Panel from '../panel';
import { basicSummary, sourceInfo, beforeAndAfterSummary, holdingChangeSummary, renderHolders, actionAmountDirection, addressChange, holderChange } from './resolvers/summaries'
import { InvalidIssue } from './resolvers/unknownShareChanges'

import { Shareholder } from '../shareholders';


function skipOrRestart(allowSkip, context, submit, reset){
    function skip(){
        return submit({
            pendingActions: [{id: context.actionSet.id, data: {...context.actionSet.data, userSkip: true}, previous_id: context.actionSet.previous_id}]
        })
    }
    function startOver(){
        return reset();
    }
    return <div>
        { !allowSkip &&  <p className="instructions">Sorry, we are unable to continue importing past this point while continuing to verify transactions.</p> }
        <div className="button-row">
            { allowSkip && <Button onClick={skip} className="btn-primary">Skip Validation</Button> }
            <Button onClick={startOver} className="btn-danger">Restart Import</Button>
        </div>
    </div>
}

const submitRestart = (...rest) => skipOrRestart(false, ...rest);
const submitSkipRestart = (...rest) => skipOrRestart(true, ...rest);


function AddressDifference(context, submit, reset){

    function skip(){
        const id = context.action.id;
        const index = context.actionSet.data.actions.findIndex(a => a.id === id);
        const actions = [...context.actionSet.data.actions];
        actions[index] = {...context.actionSet.data.actions[index], userBypassValidation: true}
        const data = {...context.actionSet.data, actions: actions}
        return submit({
            pendingActions: [{
                id: context.actionSet.id,
                data: {...data},
                previous_id: context.actionSet.previous_id}]
        });
    }

    function startOver(){
        return reset();
    }

    return <div>
         { addressChange(context) }
         <div className={"alert alert-danger"}>
         <p>Expected: "{ context.action.newAddress }"</p>
         <p>Found: "{ context.companyState[context.action.field] }"</p>
         </div>
        <div className="button-row">
            { <Button onClick={skip} className="btn-primary">Skip Validation</Button> }
            <Button onClick={startOver} className="btn-danger">Restart Import</Button>
        </div>
    </div>
}


function AnnualReturnHoldingDifference(context, submit, reset){
    function skip(){
        return submit({
            pendingActions: [{id: context.actionSet.id, data: {...context.actionSet.data, userSkip: true}, previous_id: context.actionSet.previous_id}]
        })
    }
    function startOver(){
        return reset();
    }
    return <div>
         <p className="instructions">Sorry, the Shareholdings described in the Annual Return linked above do not match our records.</p>
        <div className="button-row">
            <Button onClick={skip} className="btn-primary">Skip Validation</Button>
            <Button onClick={startOver} className="btn-danger">Restart Import</Button>
        </div>
    </div>
}

function DirectorNotFound(context, submit, reset, edit){
    function skip(){
        return submit({
            pendingActions: [{id: context.actionSet.id, data: {...context.actionSet.data, userSkip: true}, previous_id: context.actionSet.previous_id}]
        })
    }
    function startOver(){
        return reset();
    }

    return <div>
         <p className="instructions">Sorry, we could find the director "{context.action.afterName}" referenced in the document linked above.</p>
        { context.action.transactionType === TransactionTypes.UPDATE_DIRECTOR &&
                <p className="instructions">It is possible that this directorship has ceased, please consider editing the date of this transaction.</p> }
        <div className="button-row">
            <Button onClick={skip} className="btn-primary">Skip Validation</Button>
            <Button onClick={startOver} className="btn-danger">Restart Import</Button>
            { edit &&  <Button onClick={edit} className="btn-info" onClick={edit}>Edit Transaction</Button>}
        </div>
    </div>
}


function HolderNotFound(context, submit, reset){

    function startOver(){
        return reset();
    }

    function selectPerson(person){
        const id = context.action.id;
        const index = context.actionSet.data.actions.findIndex(a => a.id === id);
        const actions = [...context.actionSet.data.actions];
        const action = {...context.actionSet.data.actions[index]};
        action.afterHolder = {...action.afterHolder, personId: person.personId}
        action.beforeHolder = {...action.beforeHolder, personId: person.personId}
        actions[index] = action;
        const data = {...context.actionSet.data, actions: actions}
        return submit({
            pendingActions: [{
                id: context.actionSet.id,
                data: {...data},
                previous_id: context.actionSet.previous_id}]
        });
    }

    const holdersObj = context.companyState.holdingList.holdings.reduce((acc, holding) => {
        holding.holders.reduce((acc, holder) => {
            acc[holder.person.personId] = holder.person;
            return acc
        }, acc);
        return acc;
    }, {});

    const holders = Object.keys(holdersObj).map(k => holdersObj[k]);
    holders.sort((a, b) => a.name.localeCompare(b.name));

    return <div>
            { holderChange(context) }
         <div className="col-md-12">
             <div className={"alert alert-danger"}>
             <p>Please select the corresponding 'Updated Shareholder' from the following:</p>
             </div>
        </div>

         { holders.map((h, i) => {
            return <div key={i} className="col-md-6">
                <div className="actionable" onClick={() => selectPerson(h)}>
                    <Shareholder shareholder={h} />
                </div>
            </div>
         })}

        <div className="row">
            <div className="col-md-12">
            <div className="button-row">
                <Button onClick={startOver} className="btn-danger">Restart Import</Button>
            </div>
            </div>
        </div>
    </div>
}


function MultipleHoldings(context,  submit){
    const { companyState, shareClassMap } = context;
    let { possibleMatches } = context;
    function handleSelect(holding){
        const updatedActions = {...context.actionSet.data};
        updatedActions.actions = updatedActions.actions.map(a => {
            a = {...a};
            if(a.id === context.action.id){
                a.holdingId = holding.holdingId;
                if(a.transactionMethod === TransactionTypes.NEW_ALLOCATION){

                    a.holders = holding.holders.map(h => {
                        return {personId: h.person.personId, name: h.person.name, address: h.person.address}
                    })
                }
            }
            return a;
        })
        submit({
            pendingActions: [{id: context.actionSet.id, data: updatedActions, previous_id: context.actionSet.previous_id}]
        })
    }
    return <div>
        { beforeAndAfterSummary(context) }
         <div className="row">
            <div className="col-md-12">
            <p className="instructions">Select the shareholding that results from the above transaction</p>
            </div>
         </div>
         <div className="row">
         { possibleMatches.map((m, i) => <div key={i} className="col-md-6"><Holding holding={m} total={companyState.totalShares} select={handleSelect} shareClassMap={shareClassMap}/></div>) }
         </div>
    </div>
}

function HoldingNotFound(context,  submit){
    const { companyState, shareClassMap } = context;
    const possibleMatches = context.companyState.holdingList.holdings;

    const pendingActions = [];
    function handleSelect(holding){
        const updatedActions = {...context.actionSet.data};
        updatedActions.actions = updatedActions.actions.map(a => {
            a = {...a};

            if(a.id === context.action.id){
                a.holdingId = holding.holdingId;

                if((a.afterHolders || a.holders).length === 1 && holding.holders.length === 1){
                    // name change, just chuck it in
                    pendingActions.push({id: context.actionSet.id, data: {
                        ...context.actionSet.data,
                        actions: [{
                            transactionType: TransactionTypes.HOLDER_CHANGE,
                            beforeHolder: context.action.beforeHolders[0],
                            afterHolder: holding.holders.map(h => ({name: h.person.name, address: h.person.address, companyNumber: h.person.companyNumber, personId: h.person.personId}))[0]
                        }]

                    }, previous_id: context.actionSet.previous_id});
                }

                if(a.transactionMethod === TransactionTypes.NEW_ALLOCATION){
                    a.holders = holding.holders.map(h => {
                        return {personId: h.person.personId, name: h.person.name, address: h.person.address}
                    })
                }
            }
            return a;
        });
        pendingActions.push({id: context.actionSet.id, data: updatedActions, previous_id: context.actionSet.previous_id});

        submit({
            pendingActions: pendingActions
        })
    }
    return <div>
        { beforeAndAfterSummary(context) }
         <div className="row">
            <div className="col-md-12">
            <p className="instructions">Select the shareholding that results from the above transaction</p>
            </div>
         </div>
         <div className="row">
         { possibleMatches.map((m, i) => <div key={i} className="col-md-6"><Holding holding={m} total={companyState.totalShares} select={handleSelect} shareClassMap={shareClassMap}/></div>) }
         </div>
    </div>
}

function MultipleHoldingTransferSources(context,  submit){
    const { companyState, shareClassMap } = context;
    let { possibleMatches } = context;
    if(!possibleMatches){
        possibleMatches = context.companyState.holdingList.holdings;
    }
    function handleSelect(holding){
        const updatedActions = {...context.actionSet.data};
        updatedActions.actions = updatedActions.actions.map(a => {
            a = {...a};
            if(a.id === context.action.id){
                if(a.beforeAmountLookup){
                    a.beforeAmountLookup.holdingId = holding.holdingId;
                }
                else if(a.afterAmountLookup){
                    a.afterAmountLookup.holdingId = holding.holdingId;
                }
            }
            return a;
        })
        submit({
            pendingActions: [{id: context.actionSet.id, data: updatedActions, previous_id: context.actionSet.previous_id}]
        })
    }
    return <div>
        { beforeAndAfterSummary(context) }
         <div className="row">
            <div className="col-md-12">
            <p className="instructions">Which shareholding did this one transfer all it's shares to?</p>
            </div>
         </div>
         <div className="row">
         { possibleMatches.map((m, i) => <div key={i} className="col-md-6"><Holding holding={m} total={companyState.totalShares} select={handleSelect} shareClassMap={shareClassMap}/></div>) }
         </div>
    </div>
}


const DESCRIPTIONS = {
    [TransactionTypes.ADDRESS_CHANGE]: addressChange,
    [TransactionTypes.HOLDING_CHANGE]: holdingChangeSummary,
    [TransactionTypes.ANNUAL_RETURN]: basicSummary,
    [TransactionTypes.AMEND]:  beforeAndAfterSummary,
    [TransactionTypes.HOLDING_TRANSFER]: basicSummary,
    [TransactionTypes.NEW_ALLOCATION]: basicSummary,
    [TransactionTypes.REMOVE_ALLOCATION]: basicSummary,
    [TransactionTypes.UPDATE_DIRECTOR]: basicSummary,
    [TransactionTypes.ISSUE]: basicSummary
}

const PAGES = {
    [ImportErrorTypes.MULTIPLE_HOLDINGS_FOUND]: MultipleHoldings,
    [ImportErrorTypes.MULTIPLE_HOLDING_TRANSFER_SOURCE]: MultipleHoldingTransferSources,
    [ImportErrorTypes.HOLDER_NOT_FOUND]: HolderNotFound,
    [ImportErrorTypes.HOLDING_NOT_FOUND]: HoldingNotFound,
    [ImportErrorTypes.ANNUAL_RETURN_HOLDING_DIFFERENCE]: AnnualReturnHoldingDifference,
    [ImportErrorTypes.DIRECTOR_NOT_FOUND]: DirectorNotFound,
    [ImportErrorTypes.ANNUAL_RETURN_SHARE_COUNT_DIFFERENCE]: submitSkipRestart,

    [ImportErrorTypes.AMEND_TRANSFER_ORDER]: HoldingTransfer,
    [ImportErrorTypes.CONFIRMATION_REQUIRED]: DateConfirmation,
    [ImportErrorTypes.UNKNOWN_AMEND]: Amend,
    [ImportErrorTypes.INVALID_ISSUE]: InvalidIssue,
}




@connect((state, ownProps) => {
    return {};
}, (dispatch, ownProps) => {
    return {
        addNotification: (args) => dispatch(addNotification(args)),
        updateAction: (args) => {
            return dispatch(updateResource(`/company/${ownProps.transactionViewData.companyId}/update_pending_history`, args, {
                invalidates: [`/company/${ownProps.transactionViewData.companyId}/import_pending_history`]
            }))
            .then(() => {
                ownProps.end();
            })
        },
        resetAction: (args) => {
            return dispatch(updateResource(`/company/${ownProps.transactionViewData.companyId}/reset_pending_history`, {}, {}))
            .then(() => {
                ownProps.end();
            })
        }
    }
})
export class ResolveAmbiguityTransactionView extends React.Component {

    constructor(props){
        super(props);
    }

    renderBody() {
        const context = {message: this.props.transactionViewData.error.message, ...this.props.transactionViewData.error.context};
        const action = context.action;
        context.shareClassMap = generateShareClassMap(context.companyState);
        if(!action || !PAGES[context.importErrorType]){
            return <div className="resolve">
                { basicSummary(context, this.props.transactionViewData.companyState)}
                    <hr/>
                    <div>Unknown Import Error</div>
                    <div className="button-row">
                        <Button onClick={this.props.resetAction} className="btn-danger">Restart Import</Button>
                    </div>
                </div>
        }
        let edit;
        if(this.props.transactionViewData.editTransactionData){
            // if we are doing a yeary by year import, we have greater flexibility for importing
            edit = () => {
                const otherActions = this.props.transactionViewData.editTransactionData.pendingActions.filter(p => p.id !== context.actionSet.id)
                this.props.show('editTransaction', {...this.props.transactionViewData.editTransactionData, actionSet: context.actionSet, otherActions});
            }
        }


        return <div className="resolve">
            { basicSummary(context, this.props.transactionViewData.companyState)}
            <hr/>
            { PAGES[context.importErrorType](context, this.props.updateAction, this.props.resetAction, edit)}
        </div>
    }

    render() {
        if(!this.props.transactionViewData.error){
            return false;
        }
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Import History - More Information Required</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody() }
              </TransactionView.Body>
              <TransactionView.Footer>
            <div className="button-row">
            <Button onClick={this.props.end} >Cancel</Button>
            </div>
              </TransactionView.Footer>
            </TransactionView>
    }
}
