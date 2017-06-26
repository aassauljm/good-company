"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from '../forms/buttonInput';
import { connect } from 'react-redux';
import { reduxForm, destroy } from 'redux-form';
import Input from '../forms/input';
import DateInput from '../forms/dateInput';
import { formFieldProps, requireFields, joinAnd, newHoldingString, holdingOptionsFromState } from '../../utils';
import { Link } from 'react-router';
import { companyTransaction, addNotification, showTransactionView } from '../../actions';
import STRINGS from '../../strings';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import StaticField from '../forms/staticField';
import { ParcelWithRemove } from '../forms/parcel';
import { newHoldingFormatAction, HoldingSelectWithNew } from '../forms/holding';
import { Documents } from '../forms/documents';
import LawBrowserLink from '../lawBrowserLink';
import TEMPLATABLE from '../templates/templatable';
import { enums as TransactionTypes } from '../../../../config/enums/transactions';
import { push } from 'react-router-redux'

const fields = [
    'effectiveDate',
    'from',
    'to',
    'newHolding',
    'parcels[].shareClass',
    'parcels[].amount',
    'consideration',
    'newHolding',
    'documents'
    ];

const CREATE_NEW_SHAREHOLDING = 'create-new';

@formFieldProps()
export class Transfer extends React.Component {

    static propTypes = {
        holdingOptions: PropTypes.array.isRequired,
        shareOptions: PropTypes.array.isRequired,
        fields: PropTypes.object.isRequired,
    };

    render() {
        return <form className="form transfer-form" >
        <fieldset>
            <DateInput {...this.formFieldProps('effectiveDate')} time={true}/>
            <Input type="select" {...this.formFieldProps('from', STRINGS.transfer)} >
                <option></option>
                { this.props.holdingOptions }
            </Input>

            { /*!this.props.fields.newHolding.value &&
               <Input type="select" {...this.formFieldProps('to', STRINGS.transfer)} >
                    <option></option>
                    { this.props.holdingOptions }
                    { this.props.showNewHolding && <option value={CREATE_NEW_SHAREHOLDING}>Create new Shareholding</option> }
                </Input> */}

            <HoldingSelectWithNew {...this.props} fieldName="to" newFieldName="newHolding" strings={STRINGS.transfer}/>




                <label className="control-label">Parcels</label>
             { this.props.fields.parcels.map((p, i) => {
                return <div className="row " key={i}>
                    <ParcelWithRemove fields={p} remove={() => this.props.fields.parcels.removeField(i)} shareOptions={this.props.shareOptions}/>
                </div>
            }) }
            <div className="button-row">

            <ButtonInput className="add-parcel" onClick={() => {
                this.props.fields.parcels.addField();
            }}>Add Parcel</ButtonInput>

            {this.props.fields.from.value && <ButtonInput onClick={() => {
                const parcels = this.props.holdingMap[this.props.fields.from.value];
                let length = this.props.fields.parcels.length;
                while(length) {
                    this.props.fields.parcels.removeField(length-1);
                    length--;
                }
                parcels.map(p => this.props.fields.parcels.addField(p));
            }}>All Shares</ButtonInput> }

            </div>




            <Input type="text" {...this.formFieldProps('consideration', STRINGS.transfer) } />

        </fieldset>
        { this.props.error && <div className="alert alert-danger">
            { this.props.error.map((e, i) => <span key={i}> { e } </span>) }
        </div> }
        <Documents documents={this.props.fields.documents}/>

        </form>
    }
}

const validateBase = requireFields('effectiveDate', 'from');

export const validate = (values, props) => {
    const errors = validateBase(values);
    if(values.from && values.from === values.to){
        errors.to = ['Destination must be different from source.']
    }
    if(!values.newHolding && !values.to){
        errors['to'] = ['Required.']
    }
    const parcels = [];
    errors.parcels = values.parcels.map((p, i) => {
        const errors = {};
        const sourceParcels = props.holdingMap[values.from];
        const shareClass = parseInt(p.shareClass, 10) || null;
        const amount = parseInt(p.amount, 10);
        if(!amount){
            errors.amount = (errors.amount || []).concat(['Required.']);
        }
        else if(amount <= 0){
            errors.amount = (errors.amount || []).concat(['Must be greater than 0.']);
        }
        if(parcels.indexOf(shareClass) >= 0){
            errors.shareClass = (errors.shareClass || []).concat(['Duplicate share class.']);
        }
        parcels.push(shareClass);
        const matchedParcels = sourceParcels && sourceParcels.filter(sP => {
            if(sP.shareClass === shareClass && amount > sP.amount){
                errors.amount = (errors.amount || []).concat(['Insufficient shares in source holding.']);
            }
            return sP.shareClass === shareClass;
        })
        if(matchedParcels && !matchedParcels.length){
            errors.shareClass = (errors.shareClass || []).concat(['Source does not have any parcels of this share class.']);
        }
        return errors;
    });
    if(!values.parcels.length){
        errors._error = (errors._error || []).concat(['At least 1 parcel required.']);
    }
    return errors;

}

export function createHoldingMap(companyState){
    return companyState.holdingList.holdings.reduce((acc, val) => {
        acc[`${val.holdingId}`] = val.parcels.map(p => ({ amount: p.amount, shareClass: p.shareClass || null }));
        return acc;
    }, {});
}


export function transferFormatSubmit(values, companyState){
    const actions = [], results = [], holders = [];
    const amounts = companyState.holdingList.holdings.reduce((acc, holding) => {
        holders[`${holding.holdingId}`] = holding.holders.map(h => h.person);
        acc[`${holding.holdingId}`] = holding.parcels.reduce((acc, parcel) => {
            acc[parcel.shareClass || undefined] = parcel.amount;
            return acc;
        }, {})
        return acc;
    }, {});

    const fromHoldingId = parseInt(values.from, 10);
    actions.push({
        holdingId: fromHoldingId,
        holders: holders[values.from],
            parcels: values.parcels.map(p => {
                const shareClass = parseInt(p.shareClass, 10) || null;
                const amount = parseInt(p.amount, 10);
                return {
            shareClass: shareClass,
            amount: amount,
            beforeAmount: amounts[values.from][p.shareClass],
            afterAmount: (amounts[values.from][p.shareClass]) - amount
        }}),
        transactionType: TransactionTypes.TRANSFER_FROM,
        transactionMethod: TransactionTypes.AMEND
    });
    if(!values.newHolding){
        const toHoldingId = parseInt(values.to, 10);
        actions.push({
            holdingId: toHoldingId,
            holders: holders[values.to],
            parcels: values.parcels.map(p => {
                const shareClass = parseInt(p.shareClass, 10) || null;
                const amount = parseInt(p.amount, 10);
                return {
                    shareClass: shareClass,
                    amount: amount,
                    beforeAmount: amounts[values.to][p.shareClass] || 0,
                    afterAmount: (amounts[values.to][p.shareClass] || 0) + amount
                }
            }),
            transactionType: TransactionTypes.TRANSFER_TO,
            transactionMethod: TransactionTypes.AMEND
        });
    }
    else{
        actions.push({
            holders: values.newHolding.persons,
            parcels: values.parcels.map(p => {
                const shareClass = parseInt(p.shareClass, 10) || null;
                const amount = parseInt(p.amount, 10);
                return {
                    shareClass: shareClass,
                    amount: amount,
                    beforeAmount: 0,
                    afterAmount: amount
                }}),
            metadata: values.newHolding.metadata,
            votingShareholder: values.newHolding.votingShareholder,
            transactionType: TransactionTypes.TRANSFER_TO,
            transactionMethod: TransactionTypes.NEW_ALLOCATION
        });
    }

    results.push({
        effectiveDate: values.effectiveDate,
        transactionType: TransactionTypes.TRANSFER,
        actions: actions
    })

    return results;
}

export const TransferConnected = reduxForm({
  form: 'transfer',
  fields,
  validate,
  destroyOnUnmount: false
})(Transfer);


@connect(undefined)
export class TransferTransactionView extends React.Component {
    constructor(props) {
        super(props);
        this.submit = ::this.submit;
        this.handleClose = ::this.handleClose;
        this.handleNext = ::this.handleNext;
        this.handleDraft = ::this.handleDraft;
    }

    handleNext() {
        this._draft = false;
        this.refs.form.submit();
    }

    handleDraft() {
        this._draft = true;
        this.refs.form.submit();
        this._draft = false;
    }

    handleClose(data={}) {
        this.props.dispatch(destroy('transfer'));
        this.props.end(data);
    }

    showDraftForm(values){
        const template = TEMPLATABLE[TransactionTypes.TRANSFER];
        const location = {
            pathname: `/company/view/${this.props.transactionViewData.companyId}/templates/${template.url}`,
            query: {json: JSON.stringify(template.format(values[0], this.props.transactionViewData.companyState))}
        }
        this.props.dispatch(push(location));
    }

    submit(values) {
        const transactions = transferFormatSubmit(values, this.props.transactionViewData.companyState);
        if(this._draft){
            return this.showDraftForm(transactions)
        }
        if(transactions.length){
            this.props.dispatch(companyTransaction(
                                    'compound',
                                    this.props.transactionViewData.companyId,
                                    {transactions: transactions, documents: values.documents} ))

            .then((results) => {
                this.handleClose({reload: true});
                this.props.dispatch(addNotification({message: 'Shares Transfered'}));
                const key = this.props.transactionViewData.companyId;
                if(results.response.transactionId){
                    this.props.navigate(`/company/view/${key}/transactions/${results.response.transactionId}`);
                }
            })
            .catch((err) => {
                this.props.dispatch(addNotification({message: err.message, error: true}));
            })
        }
        else{
            this.handleClose();
        }
    }

    renderBody(companyState) {
        const holdingOptions = holdingOptionsFromState(companyState);
        const shareOptions = ((companyState.shareClasses || {}).shareClasses || []).map((s, i) => {
            return <option key={i} value={s.id}>{s.name}</option>
        });
        const holdingMap = createHoldingMap(companyState);

        return <TransferConnected ref="form"
                    initialValues={{parcels: [{}], effectiveDate: new Date() }}
                    holdingOptions={holdingOptions}
                    holdingMap={holdingMap}
                    shareOptions={shareOptions}
                    showNewHolding={() => this.props.dispatch(showTransactionView('newHolding', {
                        ...this.props.transactionViewData,
                        formName: 'transfer',
                        field: 'newHolding',
                        afterClose: { // open this transactionView again
                            showTransactionView: {key: 'transfer', data: {...this.props.transactionViewData}}
                        }
                    }))}
                    onSubmit={this.submit}/>
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'} lawLinks={transferSharesLawLinks()}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Transfer Shares</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody(this.props.transactionViewData.companyState) }
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={this.handleClose} >Cancel</Button>
                 <Button onClick={this.handleDraft} bsStyle="info">Create Draft Transfer Document</Button>
                 <Button onClick={this.handleNext} bsStyle="primary">Submit</Button>
              </TransactionView.Footer>
            </TransactionView>
    }
}


function transferSharesLawLinks(){
    return (
        <div>
            <LawBrowserLink title="Companies Act 1993" location="s 39">Transferability of shares</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 84(1)">Transfer by entry in share register</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 84(2) + (3)">Share transfer forms</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 84(4) + (5)">Refusal or delay of share transfer</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 84(6) 373(1)(20) and 374(1)">Consequences of non-compliance</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 85">Transfer under an approved system</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 86">Transfer by Operation of Law</LawBrowserLink>
        </div>
    );
}
