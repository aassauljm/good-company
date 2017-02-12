"use strict";
import React, { PropTypes } from 'react';
import { pureRender, stringDateToFormattedString, stringDateToFormattedStringTime,
        renderShareClass, generateShareClassMap, formFieldProps, requireFields, joinAnd, numberWithCommas, holdingOptionsFromState } from '../../utils';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Input from '../forms/input';
import { Link } from 'react-router'
import STRINGS from '../../strings'
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { push } from 'react-router-redux'
import TransactionView from '../forms/transactionView';
import { HoldingSelectWithNew } from '../forms/holding';
import { enums as ImportErrorTypes } from '../../../../config/enums/importErrors';
import { enums as TransactionTypes } from '../../../../config/enums/transactions';
import Amend from './resolvers/amend';
import { reduxForm, destroy } from 'redux-form';
import Panel from '../panel';
import { change } from 'redux-form';
import StaticField from '../forms/staticField';

// turns a holding/newHolding + before and after amounts into an action
function valuesToAction(values, companyState){
    const holdings = companyState.holdingList.holdings.reduce((acc, holding) => {
        acc.amounts[`${holding.holdingId}`] = holding.parcels.reduce((acc, parcel) => {
            acc[parcel.shareClass || undefined] = parcel.amount;
            return acc;
        }, {})

        acc.persons[`${holding.holdingId}`] = holding.holders.map(p => ({
            name: p.person.name, address: p.person.address, personId: p.person.personId, companyNumber: p.person.companyNumber
        }))
        return acc;
    }, {amounts: {}, persons: {}});
    const persons = values.newHolding ? values.newHolding.persons : holdings.persons[values.holding];
    return {
        transactionType: values.newHolding ? TransactionTypes.NEW_ALLOCATION : TransactionTypes.AMEND,
        //beforeAmount: !values.newHolding ? values.beforeAmount : 0,
        //afterAmount: !values.newHolding ? values.afterAmount : 0,
        holders: values.newHolding ? persons : null,
        beforeHolders: persons,
        afterHolders: persons,
        holdingId: values.newHolding ? null : values.holding.holdingId,
        transactionType: values.newHolding ? TransactionTypes.NEW_ALLOCATION : TransactionTypes.AMEND,
        isNewHolding: !!values.newHolding
    }
}


@reduxForm({
    form: 'holdingSelectWithNew',
    fields: ['holding', 'newHolding', 'parcels[].amount', 'parcels[].shareClass'],
    validate: (values) => {
        if(!values.holding && !values.newHolding){
            return {holding: ['Required']}
        }
        return {};
    },
    destroyOnUnmount: false
})
@formFieldProps()
export class SelectCreateHoldingChangeTransactionView extends React.Component {
    constructor(props){
        super();
        this.handleClose = ::this.handleClose;
        this.handleSubmit= ::this.handleSubmit;
    }
    renderBody() {
        const isNew = !!this.props.fields.newHolding.value;
        return  <div className="row">
        <div className="col-md-6 col-md-offset-3">

                <HoldingSelectWithNew
                    fieldName='holding'
                    newFieldName='newHolding'
                    fields={this.props.fields}
                    showNewHolding={() => this.props.show('newHolding', {
                         ...this.props.transactionViewData,
                        formName: 'holdingSelectWithNew',
                        field: `newHolding`,
                        noEffectiveDate: true,
                        noDocuments: true,
                        afterClose: { // open this transactionView again
                            showTransactionView: {key: 'selectCreateHoldingChange', data: {...this.props.transactionViewData}}
                        }})}
                    strings={STRINGS}
                    shareOptions={this.props.shareOptions}
                    holdingOptions={holdingOptionsFromState(this.props.transactionViewData.companyState)} />


                    { false && !isNew && <Input className="amount" type="number" {...this.formFieldProps('beforeAmount')} label={'Before Amount'} /> }
                    { false && !isNew && <Input className="amount" type="number" {...this.formFieldProps('afterAmount')} label={'After Amount'} /> }

                    {  false && isNew && <StaticField type="static"  className="amount"  {...this.formFieldProps('beforeAmount')} value={0} label={'Before Amount'} /> }
                    {  false && isNew && <StaticField type="static"  className="amount" {...this.formFieldProps('afterAmount')}  value={0} label={'After Amount'} /> }
            </div>
        </div>
    }

    handleSubmit() {
        if(this.props.transactionViewData.afterClose){
            this.props.dispatch(change(this.props.transactionViewData.formName, this.props.transactionViewData.field, valuesToAction(this.props.values, this.props.transactionViewData.companyState)));
            this.props.end(this.props.values);
            return;
        }
        else{
            this.props.end();
        }
    }

    handleClose() {
        this.props.end();
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Select or Create New Shareholding</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody() }
              </TransactionView.Body>
              <TransactionView.Footer>
            <div className="button-row">
                <Button onClick={this.handleClose} >Cancel</Button>
                <Button bsStyle={'primary'} onClick={this.handleSubmit} disabled={!this.props.valid}>Select</Button>
            </div>
              </TransactionView.Footer>
            </TransactionView>
    }
}




