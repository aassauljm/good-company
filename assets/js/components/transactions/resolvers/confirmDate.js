"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import { pureRender, stringDateToFormattedString, stringDateToFormattedStringTime, renderShareClass, formFieldProps, requireFields, joinAnd, numberWithCommas, generateShareClassMap } from '../../../utils';
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
        const { shareClassMap, fields: { actions }, amendActions, actionSet } = this.props;
        const getError = (index) => {
            return this.props.error && this.props.error.actions && this.props.error.actions[index];
        }

        return <form onSubmit={this.props.handleSubmit}>
                    <hr/>
            { actions.map((field, i) => {
                const action = amendActions[i];
                if(!TransactionRenderMap[action.transactionType]){
                    return false;
                }
                return <div  key={i}>
                    { TransactionRenderMap[action.transactionType]({...action,  data: action, effectiveDate: action.effectiveDate || actionSet.effectiveDate, parentTransaction: actionSet, companyState: this.props.companyState}) }

                <div className="row">
                    <div className="text-center">
                        <p><strong>Please confirm the effective date of this transaction:</strong></p>
                        <div className="col-md-6 col-md-offset-3">
                            <DateInput {...this.formFieldProps(['actions', i, 'effectiveDate'])} label="" time={true}/>
                        </div>


                    </div>
                </div>
                <hr/>
                </div>
            }) }

            <div className="button-row">
                <Button onClick={this.props.cancel} bsStyle="default">Cancel</Button>
             <Button onClick={this.props.resetForm}>Reset</Button>
                <Button type="submit" bsStyle="primary" disabled={!this.props.valid }>Submit</Button>
            </div>
        </form>
    }
}
const dateConfirmationFields = [
    'actions[].effectiveDate',
    'actions[].userSkip'
];

const DateConfirmationFormConnected = reduxForm({
    fields: dateConfirmationFields,
    form: 'dateConfirmationAction',
})(DateConfirmationForm);


export function DateConfirmation(props){
    const { context, submit } = props;
    const { actionSet, companyState } = context;
    const shareClassMap = generateShareClassMap(companyState);
    const actions = actionSet.data.actions ;


    const handleSubmit = (values) => {

        //const pendingActions = otherActions.length ? [{id: actionSet.id, data: {...actionSet.data, actions: otherActions}, previous_id: actionSet.previous_id}] : [];
        const pendingActions = [];
        const transactions = [];

        const confirmedActions = actions.reduce((acc, a, i) => {
            acc[values.actions[i].effectiveDate] =  acc[values.actions[i].effectiveDate] || [];
            acc[values.actions[i].effectiveDate].push({...a, effectiveDate: values.actions[i].effectiveDate, userConfirmed: true});
            return acc;
        }, {});
        const actionArray = Object.keys(confirmedActions).map(p => confirmedActions[p]);
        actionArray.sort((a, b) => {
            return b[0].effectiveDate - a[0].effectiveDate
        });
        actionArray.map(actions => {
            pendingActions.push({id: actionSet.id, data: {...actionSet.data, effectiveDate: actions[0].effectiveDate, totalShares: null, actions: actions}, previous_id: actionSet.previous_id});
        });
        submit({
            newActions: pendingActions
        })
    }

    let initialValues = {actions: actions.map((a, i) => {
        // if all same direction, set amount;
        const effectiveDate = moment(a.effectiveDate || actionSet.data.effectiveDate).startOf('day').toDate();
        return { effectiveDate: effectiveDate }
    })};

    return <div>
            <DateConfirmationFormConnected
            amendActions={actions }
            actionSet={actionSet.data}
            effectiveDate={moment(actionSet.data.effectiveDate).startOf('day').toDate()}
            cancel={props.cancel}
            companyState={companyState}
            shareClassMap={shareClassMap}
            onSubmit={handleSubmit}
            initialValues={initialValues} />
        </div>
}