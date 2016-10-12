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
import Amend from './resolvers/amend';
import { Holding } from '../shareholdings';
import { reduxForm } from 'redux-form';
import Panel from '../panel';
import { basicSummary, sourceInfo, beforeAndAfterSummary, holdingChangeSummary, renderHolders, actionAmountDirection } from './resolvers/summaries'


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
        { allowSkip && <Button onClick={skip} className="btn-primary">Skip Annual Return Validation</Button> }
        <Button onClick={startOver} className="btn-danger">Restart Import</Button>
    </div>
    </div>
}

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
    [ImportErrorTypes.UNKNOWN_AMEND]: Amend
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
                { basicSummary(context, this.props.modalData.companyState)}
                    <hr/>
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
