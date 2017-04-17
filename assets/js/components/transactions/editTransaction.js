"use strict";
import React, { PropTypes } from 'react';
import { requestResource, updateResource, showTransactionView, addNotification, showLoading, endLoading } from '../../actions';
import { pureRender, stringDateToFormattedString, stringDateToFormattedStringTime, renderShareClass,
    generateShareClassMap, formFieldProps, requireFields, joinAnd, numberWithCommas,  collectAmendActions, collectShareChangeActions } from '../../utils';
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
import { DateConfirmation }  from './resolvers/confirmDate';
import { Holding } from '../shareholdings';
import { reduxForm, destroy } from 'redux-form';
import Panel from '../panel';
import { basicSummary, sourceInfo, beforeAndAfterSummary, holdingChangeSummary, renderHolders, actionAmountDirection, addressChange, holderChange } from './resolvers/summaries'
import { InvalidIssue } from './resolvers/unknownShareChanges'
import { Shareholder } from '../shareholders';
import Loading from '../loading';
import firstBy from 'thenby';
import ScrollIntoView from '../../hoc/scrollIntoView';

const DEFAULT_OBJ = {};


export function reorderAllPending(pendingActions, newActions) {
    pendingActions = pendingActions.map((p, i) => {
        return {...p, originalIndex: i}
    });;


    const ids = newActions.reduce((acc, newActionSet) => {
        return newActionSet.data.actions.reduce((acc, action) => {
            acc[action.id] = true;
            return acc;
        }, acc)
    }, {})



    // pendingActions are all actions
    // newActions MAY replace a subset of those actions
    const orderedActions = pendingActions.reduce((acc, pA) => {
        const newActionSets = newActions.filter(nA => nA.id === pA.id);
        if(newActionSets.length){
            return acc.concat(newActionSets)
        }
        else{
            pA =  {...pA, data: {...pA.data, actions: pA.data.actions.filter(a => !ids[a.id])}}
            return acc.concat([pA]);
        }
    }, []).filter(p => p.data.actions.length);



    orderedActions.sort(firstBy(x => new Date(x.data.effectiveDate), -1)
                        .thenBy(x => x.orderIndex || 0)
                        .thenBy(x => x.originalIndex || 0)
                        .thenBy(x => x.data.orderFromSource || 0)
                        .thenBy(x => new Date(x.data.date), -1));
    return orderedActions;

}


@ScrollIntoView
@connect((state, ownProps) => {
    return {updating: state.resources[`/company/${ownProps.transactionViewData.companyId}/${ownProps.transactionViewData.isFuture ? 'update_pending_future' : 'update_pending_history'}`] || DEFAULT_OBJ};
}, (dispatch, ownProps) => {
    return {
        addNotification: (args) => dispatch(addNotification(args)),
        updateAction: (args) => {
            dispatch(showLoading({message: 'Saving'}))
            return dispatch(updateResource(`/company/${ownProps.transactionViewData.companyId}/${ownProps.transactionViewData.isFuture ? 'update_pending_future' : 'update_pending_history'}`, args, {
                invalidates: [`/company/${ownProps.transactionViewData.companyId}`]
            }))
            .then(() => {
                dispatch(endLoading())
            })
        },
        resetAction: (args) => {
            return dispatch(updateResource(`/company/${ownProps.transactionViewData.companyId}/reset_pending_history`, {}, {}))
        },
        destroyForm: (args) => dispatch(destroy(args))
    }
})
export class EditTransactionView extends React.Component {
    constructor(props){
        super();
        this.handleClose = ::this.handleClose;
    }
    renderBody() {
        const actionSet = this.props.transactionViewData.actionSet;
        const amendables = actionSet && collectAmendActions( actionSet.data.actions).concat(collectShareChangeActions(actionSet.data.actions));
        const updateAction = ({newActions}) => {
            const orderedActions = reorderAllPending(this.props.transactionViewData.pendingActions, newActions);
            if(this.props.transactionViewData.isFuture){
                orderedActions.reverse();
            }
            orderedActions[0].id = this.props.transactionViewData.startId;
            orderedActions[orderedActions.length-1].previous_id = this.props.transactionViewData.endId;
            this.props.updateAction({pendingActions: orderedActions});
            this.handleClose();
        }

        if(this.props.updating._status !== 'fetching'){
            if(amendables.length){
                return Amend({context: this.props.transactionViewData, submit: updateAction, ...this.props, viewName: 'editTransaction', cancel: () =>  this.props.end({cancelled: true}) })
            }
            else{
                return DateConfirmation({context: this.props.transactionViewData, submit: updateAction, ...this.props, viewName: 'editTransaction', cancel: () =>  this.props.end({cancelled: true})})
            }
        }
        else{
            return <Loading />
        }
    }

    handleClose() {
        this.props.end();
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Edit Transactions</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.props.transactionViewData.actionSet && basicSummary(this.props.transactionViewData, this.props.transactionViewData.companyState) }
                { this.renderBody() }
              </TransactionView.Body>
            </TransactionView>
    }
}