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
import { reduxForm } from 'redux-form';
import Panel from '../panel';
import { basicSummary, sourceInfo, beforeAndAfterSummary, holdingChangeSummary, renderHolders, actionAmountDirection, addressChange, holderChange } from './resolvers/summaries'
import { InvalidIssue } from './resolvers/unknownShareChanges'
import { Shareholder } from '../shareholders';
import firstBy from 'thenby';


@connect((state, ownProps) => {
    return {};
}, (dispatch, ownProps) => {
    return {
        addNotification: (args) => dispatch(addNotification(args)),
        updateAction: (args) => {
            return dispatch(updateResource(`/company/${ownProps.transactionViewData.companyId}/update_pending_history`, args, {
                //invalidates: [`/company/${ownProps.transactionViewData.companyId}/import_pending_history`]
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
export class EditTransactionView extends React.Component {
    renderBody(){
        const actionSet = this.props.transactionViewData.actionSet;
        const hasAmend = actionSet.data.actions.some(action =>[TransactionTypes.AMEND, TransactionTypes.NEW_ALLOCATION].indexOf(action.transactionMethod || action.transactionType) >= 0);
        const updateAction = (newActions) => {
            const otherActions = this.props.transactionViewData.otherActions;
            const previousAction = this.props.transactionViewData.previousAction;
            const orderedActions = otherActions.concat(newActions.pendingActions);

            orderedActions.sort(firstBy(x => new Date(x.data.effectiveDate), -1).thenBy(x => x.data.orderIndex));
            orderedActions[0].id = this.props.transactionViewData.startId;
            orderedActions[orderedActions.length-1].previous_id = this.props.transactionViewData.endId;

            this.props.updateAction({pendingActions: orderedActions});
        }
        if(hasAmend){
            return Amend({...this.props.transactionViewData}, updateAction)
        }
        else{
            return DateConfirmation({...this.props.transactionViewData}, updateAction)
        }
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Edit Transactions</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { basicSummary(this.props.transactionViewData, this.props.transactionViewData.companyState)}
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