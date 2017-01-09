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
import { TransactionRenderMap } from '../../transaction';
import { enums as ImportErrorTypes } from '../../../../../config/enums/importErrors';
import { enums as TransactionTypes } from '../../../../../config/enums/transactions';
import { Holding } from '../../shareholdings';
import { reduxForm } from 'redux-form';
import Panel from '../../panel';
import { basicSummary, sourceInfo, beforeAndAfterSummary, holdingChangeSummary, renderHolders, actionAmountDirection } from './summaries'
import moment from 'moment';
import Shuffle from 'react-shuffle';



@formFieldProps()
class DateConfirmationForm extends React.Component {

    render() {
        const { shareClassMap, fields: { actions }, amendActions, allSameDirection, actionSet } = this.props;
        const getError = (index) => {
            return this.props.error && this.props.error.actions && this.props.error.actions[index];
        }

        return <form onSubmit={this.props.handleSubmit}>
            { /* <div className="button-row">
                <Button onClick={this.props.resetForm}>Reset</Button>
                <Button type="submit" bsStyle="primary" disabled={!this.props.valid }>Submit</Button>
            </div>
                    */ }
                    <hr/>
            { actions.map((field, i) => {
                const action = amendActions[i];
                const increase = actionAmountDirection(action);

                return <div  key={i}>

                    { TransactionRenderMap[action.transactionType]({...action,  data: action, effectiveDate: action.effectiveDate || actionSet.effectiveDate, parentTransaction: actionSet, companyState: this.props.companyState}) }

                <div className="row">
                <div className="text-center">
                <p><strong>Please confirm the effective date of this transaction:</strong></p>
                    <div className="col-md-6 col-md-offset-3">
                     <DateInput {...this.formFieldProps(['actions', i, 'effectiveDate'])} label=""/>
                     </div>
                </div>
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
const dateConfirmationFields = [
    'actions[].effectiveDate'
];

const DateConfirmationFormConnected = reduxForm({
    fields: dateConfirmationFields,
    form: 'dateConfirmationAction',
})(DateConfirmationForm);


export function DateConfirmation(context, submit){
    const { actionSet, companyState, shareClassMap } = context;
    const amendActions = actionSet.data.actions; //.filter(action => [TransactionTypes.AMEND, TransactionTypes.NEW_ALLOCATION].indexOf(action.transactionMethod || action.transactionType) >= 0 && !action.userConfirmed);
    const otherActions = actionSet.data.actions.filter(action => amendActions.indexOf(action) === -1);

    const handleSubmit = (values) => {

        const pendingActions = [{id: actionSet.id, data: {...actionSet.data, actions: otherActions}, previous_id: actionSet.previous_id}];
        const transactions = [];

        const actions = amendActions.reduce((acc, a, i) => {
            acc[values.actions[i].effectiveDate] =  acc[values.actions[i].effectiveDate] || [];
            acc[values.actions[i].effectiveDate].push({...a, effectiveDate: values.actions[i].effectiveDate, userConfirmed: true});
            return acc;
        }, {});
        const actionArray = Object.keys(actions).map(p => actions[p]);
        actionArray.sort((a, b) => {
            return a[0].effectiveDate < b[0].effectiveDate
        });
        actionArray.map(actions => {
            pendingActions.push({id: actionSet.id, data: {...actionSet.data, effectiveDate: actions[0].effectiveDate, totalShares: null, actions: actions}, previous_id: actionSet.previous_id});
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
        return { effectiveDate: effectiveDate }
    })};



    return <div>
            <DateConfirmationFormConnected
            amendActions={amendActions }
            actionSet={actionSet.data}
            effectiveDate={moment(actionSet.data.effectiveDate).startOf('day').toDate()}
            totalAmount={actionSet.data.totalAmount}
            allSameDirection={allSameDirection}
            companyState={companyState}
            shareClassMap={shareClassMap}
            onSubmit={handleSubmit}
            initialValues={initialValues} />
        </div>
}