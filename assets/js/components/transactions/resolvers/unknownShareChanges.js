"use strict";
import React from 'react';
import PropTypes from 'prop-types';
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


let keyIndex = 0;

function increaseOptions(){
    return [
        <option key={1} value={TransactionTypes.ISSUE}>{STRINGS.transactionVerbs[TransactionTypes.ISSUE]}</option>,
         <option key={0} value={TransactionTypes.TRANSFER}>{STRINGS.transactionVerbs[TransactionTypes.TRANSFER]}</option>,
        <option key={3} value={TransactionTypes.CONVERSION}>{STRINGS.transactionVerbs[TransactionTypes.CONVERSION]}</option>
    ];
};

function decreaseOptions(){
    return [
        <option key={0} value={TransactionTypes.TRANSFER}>{STRINGS.transactionVerbs[TransactionTypes.TRANSFER]}</option>,
        <option key={2} value={TransactionTypes.REDEMPTION}>{STRINGS.transactionVerbs[TransactionTypes.REDEMPTION]}</option>,
        <option key={3} value={TransactionTypes.ACQUISITION}>{STRINGS.transactionVerbs[TransactionTypes.ACQUISITION]}</option>,
        <option key={4} value={TransactionTypes.CONSOLIDATION}>{STRINGS.transactionVerbs[TransactionTypes.CONSOLIDATION]}</option>
    ];
};

@formFieldProps()
class UnknownChange extends React.Component {
    render() {
        return <form onSubmit={this.props.handleSubmit}>


            <DateInput {...this.formFieldProps('effectiveDate')} time={true}/>
            <Input type="number" {...this.formFieldProps('amount')} />


            <div className="button-row">
                <Button type="submit" onClick={this.props.reset}>Reset</Button>
                <Button type="submit" bsStyle="primary" disabled={!this.props.valid }>Submit</Button>
            </div>
        </form>
    }
}



const UnknownIssueConnected = reduxForm({
    fields: ['effectiveDate', 'amount', 'shareClass'],
    form: 'unknownShareChange'
})(UnknownChange);



export const InvalidIssue  = (props) => {
    const { context, submit } = props;
    const handleSubmit = (values) => {
        const actionSet = context.actionSet;
        const amount = parseInt(values.amount, 10);
        const total = context.companyState.totalShares;
        actionSet.data.actions = [{...actionSet.data.actions[0], ...values, amount: amount, fromAmount: total - amount, toAmount: total, effectiveDate: values.effectiveDate}]
        actionSet.data.effectiveDate = values.effectiveDate;
        const pendingActions = [{id: actionSet.id, data: {...actionSet.data }, previous_id: actionSet.previous_id}];
        submit({
            pendingActions: pendingActions
        })
    }
    const initialValues = {
        effectiveDate: new Date(context.action.effectiveDate),
        amount: context.companyState.totalUnallocatedShares
    }
    return <div className="row"><div className="col-md-6 col-md-offset-3">
    <div className="alert alert-danger">Please confirm the amount and date of the issue described in the document above.</div>
            <UnknownIssueConnected initialValues={initialValues} onSubmit={handleSubmit}/>
        </div>
        </div>
}
