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
import { DateConfirmation }  from './resolvers/confirmDate';
import { Holding } from '../shareholdings';
import { reduxForm, destroy } from 'redux-form';
import Panel from '../panel';
import { basicSummary, sourceInfo, beforeAndAfterSummary, holdingChangeSummary, renderHolders, actionAmountDirection, addressChange, holderChange } from './resolvers/summaries'
import { InvalidIssue } from './resolvers/unknownShareChanges'
import { Shareholder } from '../shareholders';
import firstBy from 'thenby';

const TRANSACTION_ORDER = {
    [TransactionTypes.COMPOUND_REMOVALS]: 1
}

@connect((state, ownProps) => {
    return {};
}, (dispatch, ownProps) => {
    return {
        addNotification: (args) => dispatch(addNotification(args)),
        updateAction: (args) => {
            return dispatch(updateResource(`/company/${ownProps.transactionViewData.companyId}/update_pending_history`, args, {
                //invalidates: [`/company/${ownProps.transactionViewData.companyId}/import_pending_history`]
            }))
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
        const hasAmend = actionSet && actionSet.data.actions.some(action =>[TransactionTypes.AMEND, TransactionTypes.NEW_ALLOCATION].indexOf(action.transactionMethod || action.transactionType) >= 0);
        const updateAction = (newActions) => {
            const otherActions = this.props.transactionViewData.otherActions;
            const previousAction = this.props.transactionViewData.previousAction;
            const orderedActions = otherActions.concat(newActions.pendingActions);

            orderedActions.sort(firstBy(x => new Date(x.data.effectiveDate), -1).thenBy(x => new Date(x.data.date), -1).thenBy(x => x.data.orderIndex).thenBy(x => TRANSACTION_ORDER[x.data.transactionType] || 1000));
            orderedActions[0].id = this.props.transactionViewData.startId;
            orderedActions[orderedActions.length-1].previous_id = this.props.transactionViewData.endId;
            debugger
            this.props.updateAction({pendingActions: orderedActions})
            .then(() => {
                this.handleClose();
            })
        }
        if(hasAmend || !actionSet){
            return Amend({context: this.props.transactionViewData, submit: updateAction, ...this.props})
        }
        else{
            return DateConfirmation({context: this.props.transactionViewData, submit: updateAction, ...this.props})
        }
    }

    handleClose() {
        this.props.end({cancelled: true});
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
              <TransactionView.Footer>
            <div className="button-row">
            <Button onClick={this.handleClose} >Cancel</Button>
            </div>
              </TransactionView.Footer>
            </TransactionView>
    }
}