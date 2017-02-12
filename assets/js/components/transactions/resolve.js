"use strict";
import React, { PropTypes } from 'react';
import { requestResource, updateResource, showTransactionView, addNotification, showLoading, endLoading } from '../../actions';
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
import Loading from '../loading';
import { reduxForm, destroy } from 'redux-form';
import Panel from '../panel';
import { basicSummary, sourceInfo, beforeAndAfterSummary, holdingChangeSummary, renderHolders, actionAmountDirection, addressChange, holderChange } from './resolvers/summaries'
import { InvalidIssue } from './resolvers/unknownShareChanges'

import { Shareholder } from '../shareholders';
import { Director } from '../directors';


function skipOrRestart(props){
    const { allowSkip, reset } = props;

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
            <Button onClick={startOver} className="btn-danger">Restart Reconciliation</Button>
        </div>
    </div>
}

const submitRestart = (props) => skipOrRestart({allowSkip: false, ...props});
const submitSkipRestart = (props) => skipOrRestart({allowSkip: true, ...props});


function AddressDifference(props){
    const { context, submit, reset } = props;
    const { companyState, shareClassMap } = context;

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
            <Button onClick={props.cancel} bsStyle="default">Cancel</Button>
            { <Button onClick={skip} className="btn-primary">Skip Validation</Button> }
            <Button onClick={startOver} className="btn-danger">Restart Reconciliation</Button>
        </div>
    </div>
}


function AnnualReturnHoldingDifference(props){
    const { context, submit, reset } = props;
    const { companyState, shareClassMap } = context;
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
            <Button onClick={props.cancel} bsStyle="default">Cancel</Button>
            <Button onClick={skip} className="btn-primary">Skip Validation</Button>
            <Button onClick={startOver} className="btn-danger">Restart Reconciliation</Button>
        </div>
    </div>
}

function DirectorNotFound(props){
    const { context, submit, reset, edit } = props;
    const { companyState, shareClassMap } = context;

    function skip(){
        return submit({
            pendingActions: [{id: context.actionSet.id, data: {...context.actionSet.data, userSkip: true}, previous_id: context.actionSet.previous_id}]
        })
    }
    function startOver(){
        return reset();
    }

    return <div>
         <p className="instructions">Sorry, we could not find the director "{context.action.afterName || context.action.name}" referenced in the document linked above.</p>
        { context.action.transactionType === TransactionTypes.UPDATE_DIRECTOR &&
                <p className="instructions">It is possible that this directorship has ceased, please consider editing the date of this transaction.</p> }
        <div className="button-row">
            <Button onClick={props.cancel} bsStyle="default">Cancel</Button>
            <Button onClick={skip} className="btn-primary">Skip Validation</Button>
            <Button onClick={startOver} className="btn-danger">Restart Reconciliation</Button>
            { edit &&  <Button onClick={edit} className="btn-info" onClick={edit}>Edit Transaction</Button>}
        </div>
    </div>
}

function MultipleDirectors(props){
    const { context, submit, reset, edit } = props;
    const { companyState, shareClassMap } = context;

    function skip(){
        return submit({
            pendingActions: [{id: context.actionSet.id, data: {...context.actionSet.data, userSkip: true}, previous_id: context.actionSet.previous_id}]
        })
    }
    function startOver(){
        return reset();
    }

    function selectPerson(person){
        const id = context.action.id;
        const index = context.actionSet.data.actions.findIndex(a => a.id === id);
        const actions = [...context.actionSet.data.actions];
        const action = {...context.actionSet.data.actions[index]};
        if(action.transactionType === TransactionTypes.UPDATE_DIRECTOR){
            action.afterHolder = {...action.afterHolder, personId: person.personId}
            action.beforeHolder = {...action.beforeHolder, personId: person.personId}
        }
        else{
            action.name = person.person.name;
            action.address = person.person.address;
            action.personId = person.person.personId;
        }
        actions[index] = action;
        const data = {...context.actionSet.data, actions: actions}
        return submit({
            pendingActions: [{
                id: context.actionSet.id,
                data: {...data},
                previous_id: context.actionSet.previous_id}]
        });
    }

    const directorsEven = props.context.companyState.directorList.directors.filter((h, i) => !(i % 2));

    const directorsOdd= props.context.companyState.directorList.directors.filter((h, i) => !!(i % 2));

    return <div>
         <p className="instructions">Sorry, we could not find the director "{context.action.afterName || context.action.name}" referenced in the document linked above.  Please select them from list below.</p>

          <div className="row">
            <div className="col-md-6">
            { directorsEven .map((h, i) => {
                return <div key={i} className="actionable" onClick={() => selectPerson(h)}>
                    <Director director={h} />
                </div>
                })}
            </div>

            <div  className="col-md-6">
            {directorsOdd.map((h, i) => {
                return <div key={i} className="actionable" onClick={() => selectPerson(h)}>
                     <Director director={h} />
                </div>
                })}
            </div>
        </div>
        <div className="button-row">
        <Button onClick={props.cancel} bsStyle="default">Cancel</Button>
            <Button onClick={skip} className="btn-primary">Skip Validation</Button>
            <Button onClick={startOver} className="btn-danger">Restart Reconciliation</Button>
            { edit &&  <Button onClick={edit} className="btn-info" onClick={edit}>Edit Transaction</Button>}
        </div>
    </div>
}


function HolderNotFound(props){
    const { context, submit, reset } = props;
    const { companyState, shareClassMap } = context;
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

    const holdersOdd = holders.filter((h, i) => !(i % 2));
    const holdersEven = holders.filter((h, i) => !!(i % 2));

    return <div>
            { holderChange(context) }
         <div className="col-md-12">
             <div className={"alert alert-danger"}>
             <p>Please select the corresponding 'Updated Shareholder' from the following:</p>
             </div>
        </div>

            <div className="col-md-6">
            { holdersEven.map((h, i) => {
                return <div key={i} className="actionable" onClick={() => selectPerson(h)}>
                    <Shareholder shareholder={h} />
                </div>
                })}
            </div>

            <div  className="col-md-6">
            { holdersOdd.map((h, i) => {
                return <div key={i} className="actionable" onClick={() => selectPerson(h)}>
                    <Shareholder shareholder={h} />
                </div>
                })}
            </div>

        <div className="row">
            <div className="col-md-12">
            <div className="button-row">
                <Button onClick={props.cancel} bsStyle="default">Cancel</Button>
                <Button onClick={startOver} className="btn-danger">Restart Reconciliation</Button>
            </div>
            </div>
        </div>
    </div>
}


function MultipleHoldings(props){
    const { context, submit } = props;
    let { possibleMatches } = context;
    const { companyState, shareClassMap } = context;
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

function HoldingNotFound(props){
    const { context, submit, edit } = props;
    const { companyState, shareClassMap } = context;
    let possibleMatches = context.companyState.holdingList.holdings.filter(h => {
        return h.parcels.reduce((sum, p) => sum + p.amount, 0) === context.action.afterAmount;
    });
    if(!possibleMatches.length){
        possibleMatches = context.companyState.holdingList.holdings;
    }
    const pendingActions = [];
    function handleSelect(holding){
        const updatedActions = {...context.actionSet.data};
        updatedActions.actions = updatedActions.actions.map(a => {
            a = {...a};

            if(a.id === context.action.id){
                const afterHolders = holding.holders.map(h => ({name: h.person.name, address: h.person.address, companyNumber: h.person.companyNumber, personId: h.person.personId}));
                a.holdingId = holding.holdingId;

                // there are cases where the names are unpopulated
                if(!a.afterHolders || a.afterHolders.length === 0){
                    a.afterHolders = afterHolders;
                }
                if(!a.beforeHolders || a.beforeHolders.length === 0){
                    a.beforeHolders = afterHolders;
                }
                if((a.afterHolders || a.holders).length === 1 && holding.holders.length === 1 && JSON.stringify(a.afterHolders) !== JSON.stringify(a.beforeHolders)){
                    // name change, just chuck it in
                    pendingActions.push({id: context.actionSet.id, data: {
                        ...context.actionSet.data,
                        actions: [{
                            transactionType: TransactionTypes.HOLDER_CHANGE,
                            beforeHolder: context.action.beforeHolders[0],
                            afterHolder: afterHolders[0]
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
         <div className="col-md-6">{ possibleMatches.filter((f, i) => i % 2 === 0).map((m, i) => <div key={i}><Holding holding={m} total={companyState.totalShares} select={handleSelect} shareClassMap={shareClassMap}/></div>) }</div>
         <div className="col-md-6">{ possibleMatches.filter((f, i) => i % 2 === 1).map((m, i) => <div key={i}><Holding holding={m} total={companyState.totalShares} select={handleSelect} shareClassMap={shareClassMap}/></div>) }</div>
         </div>
         { edit && <div className="button-row">
         <Button onClick={props.cancel} bsStyle="default">Cancel</Button>
           <Button onClick={edit} className="btn-info" onClick={edit}>Edit Transaction</Button>
        </div> }

    </div>
}

function MultipleHoldingTransferSources(props){
    const { context, submit } = props;
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
    [ImportErrorTypes.MULTIPLE_DIRECTORS_FOUND]: MultipleDirectors,
    [ImportErrorTypes.ANNUAL_RETURN_SHARE_COUNT_DIFFERENCE]: submitSkipRestart,

    [ImportErrorTypes.AMEND_TRANSFER_ORDER]: HoldingTransfer,
    [ImportErrorTypes.CONFIRMATION_REQUIRED]: DateConfirmation,
    [ImportErrorTypes.UNKNOWN_AMEND]: Amend,
    [ImportErrorTypes.INVALID_ISSUE]: InvalidIssue,
}


const DEFAULT_OBJ = {};

@connect((state, ownProps) => {
    return {updating: state.resources[`/company/${ownProps.transactionViewData.companyId}/update_pending_history`] || DEFAULT_OBJ};
}, (dispatch, ownProps) => {
    return {
        addNotification: (args) => dispatch(addNotification(args)),
        updateAction: (args) => {
            return dispatch(updateResource(`/company/${ownProps.transactionViewData.companyId}/update_pending_history`, args, {
                invalidates: [`/company/${ownProps.transactionViewData.companyId}`]
            }))
            .then(() => {
                ownProps.end();
                dispatch(destroy('amend'));
            })
        },
        resetAction: (args) => {
            dispatch(showLoading({message: 'Resetting Company Reconciliation'}));
            return dispatch(updateResource(`/company/${ownProps.transactionViewData.companyId}/reset_pending_history`, {}, {}))
            .then(() => {
                dispatch(endLoading());
                ownProps.end();
                dispatch(destroy('amend'));
            })
        },
        destroyForm: (args) => {
            return dispatch(destroy(args))
        },
        cancel: (args) => {
            dispatch(push(`/company/view/${ownProps.transactionViewData.companyId}`))
        }
    }
})
export class ResolveAmbiguityTransactionView extends React.Component {

    constructor(props){
        super(props);
        this.handleClose = ::this.handleClose;
    }
    handleClose() {
        this.props.end();
    }
    renderBody() {
        const context = {message: this.props.transactionViewData.error.message, ...this.props.transactionViewData.error.context};
        const action = context.action;
        context.shareClassMap = generateShareClassMap(this.props.transactionViewData.companyState);

        if(!action || !PAGES[context.importErrorType]){
            return <div className="resolve">
                { basicSummary(context, this.props.transactionViewData.companyState)}
                    <hr/>
                    <div><p>An unknown problem occured while importing.  Please Restart the import process.</p></div>
                    <div className="button-row">
                        <Button onClick={this.props.resetAction} className="btn-danger">Restart Reconciliation</Button>
                    </div>
                </div>
        }
        let edit;
        if(this.props.transactionViewData.editTransactionData){
            // if we are doing a yeary by year import, we have greater flexibility for importing
            edit = () => {
                const otherActions = this.props.transactionViewData.editTransactionData.pendingActions.filter(p => p.id !== context.actionSet.id);
                // gross
                this.props.show('editTransaction', {...this.props.transactionViewData.editTransactionData, actionSet: context.actionSet, otherActions});
                this.props.destroyForm('amend');
            }
        }

        if(this.props.updating._status !== 'fetching'){
            return <div className="resolve">
                { basicSummary(context, this.props.transactionViewData.companyState)}
                <hr/>
                { PAGES[context.importErrorType]({context: context, submit: this.props.updateAction, reset: this.props.resetAction, edit: edit, viewName: 'resolveAmbiguity', resolving: true, ...this.props}) }
            </div>
        }
        else{
            return <Loading />
        }
    }

    render() {
        if(!this.props.transactionViewData.error){
            return false;
        }
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>{ STRINGS.importCompanyHistory } - More Information Required</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody() }
              </TransactionView.Body>
            </TransactionView>
    }
}
