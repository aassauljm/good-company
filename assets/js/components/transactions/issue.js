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
import { formFieldProps, requireFields, joinAnd, renderShareClass, generateShareClassMap } from '../../utils';
import { Link } from 'react-router';
import { companyTransaction, addNotification, showTransactionView } from '../../actions';
import STRINGS from '../../strings';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { ParcelWithRemove } from '../forms/parcel';
import { HoldingWithRemove, newHoldingFormatAction } from '../forms/holding';
import WorkingDays from '../forms/workingDays';
import { Documents } from '../forms/documents';
import LawBrowserLink from '../lawBrowserLink';


const CREATE_NEW_SHARE_CLASS = 'create-new';

const fields = [
    'effectiveDate',
    "noticeDate",
    'parcels[].amount',
    'parcels[].shareClass',
    'holdings[].newHolding',
    'holdings[].holding',
    'holdings[].parcels[].amount',
    'holdings[].parcels[].shareClass',
    'approvalDocuments[].documentType',
    'approvalDocuments[].date',
    'documents'
];



const APPROVAL_DOCUMENT_TYPES = [
    "Amalgamation Proposal",
    "Application for Registration",
    "Board Resolution",
    "Shareholder Resolution",
    "Conversion of Financial Product",
    "Court Order",
    "Entitled Persons Agreement/Concurrence"];


const approvalOptions = (() => {
    return APPROVAL_DOCUMENT_TYPES.map((a, i) => <option key={i} value={a}>{a}</option>);
})();


@formFieldProps()
export class ApprovalDocument extends React.Component {
    render() {
        return <div className="input-group-with-remove col-xs-12">
                    <div>
                        <Input type="select" {...this.formFieldProps('documentType')} placeholder={'Amount'} label={null}>
                            { this.props.approvalOptions }
                        </Input>
                    </div>
                    <div >
                        <DateInput  className="shareClass"  {...this.formFieldProps('date')}  label={null}/>
                    </div>
                    <div>
                        <button className="btn btn-default remove-parcel" onClick={(e) => {
                            e.preventDefault();
                            this.props.remove()
                        }}><Glyphicon glyph='trash'/></button>
                    </div>
            </div>
        }
}


const validate = (data, props) => {
    const remainder = {};
    data.parcels.map(p => {
        remainder[p.shareClass || undefined] = (remainder[p.shareClass || undefined] || 0) + (parseInt(p.amount, 10) || 0);
    });
    data.holdings.map(h => {
        h.parcels.map(p => {
             remainder[p.shareClass || undefined] = (remainder[p.shareClass || undefined] || 0) - (parseInt(p.amount, 10) || 0);
        })
    });
    const formErrors = {};
    if(Object.values(remainder).some(e => e)){
        formErrors.remainder = remainder;
    }
    if(!data.parcels.length){
        formErrors.parcels = ['Required.'];
    }

    const classes = {}, holdingIds = {};
    const errors = { ...requireFields('effectiveDate')(data),
        parcels: data.parcels.map(p => {
            const errors = requireFields('amount')(p);
            const amount = parseInt(p.amount, 10);

            const shareClass = parseInt(p.shareClass, 10) || '';
            if(!amount){
                errors.amount = ['Required.'];
            }
            else if(amount <= 0){
                errors.amount = ['Must be greater than 0.'];
            }
            if(classes[shareClass]){
                errors.shareClass = ['Duplicate share class.'];
            }
            classes[shareClass] = true;
            return errors;
        }),
        holdings: data.holdings.map(h => {
            const classes = {};
            const errors = {};
            errors.parcels = h.parcels.map(p => {
                const errors = {};
                const shareClass = parseInt(p.shareClass, 10) || '';
                const amount = parseInt(p.amount, 10);
                if(!amount){
                    errors.amount = ['Required.'];
                }
                else if(amount <= 0){
                    errors.amount = ['Must be greater than 0.'];
                }
                if(classes[shareClass]){
                    errors.shareClass = ['Duplicate share class.'];
                }
                classes[shareClass] = true;
                return errors;
            })
            if(!h.newHolding){
                if(!h.holding){
                    errors.holding = ['Required.'];
                }
                if(holdingIds[h.holding]){
                    errors.holding = ['Duplicate holding.'];
                }
                holdingIds[h.holding] = true;
            }
            return errors;
        }), _error: Object.keys(formErrors).length ? formErrors: null };
        return errors;
}


@formFieldProps()
export class Issue extends React.Component {

    static propTypes = {
        holdingOptions: PropTypes.array.isRequired,
        shareOptions: PropTypes.array.isRequired,
        shareClassMap: PropTypes.object.isRequired,
    };

    renderRemaining() {
        if(this.props.error && this.props.error.remainder){
            return Object.keys(this.props.error.remainder).map(r => {
                return this.props.error.remainder[r] && <div key={r}>
                    <div className="alert alert-danger">
                        { this.props.error.remainder[r] > 0 && <span >There are <strong>
                            { this.props.error.remainder[r] }</strong> shares of class { renderShareClass(r, this.props.shareClassMap)} shares left to allocate.</span> }
                        { this.props.error.remainder[r] < 0 && <span >There are <strong>
                            { -this.props.error.remainder[r] }</strong> shares of class { renderShareClass(r, this.props.shareClassMap) } shares over allocated.</span> }
                    </div>
                </div>
            });
        }
    };

    renderParcelErrors() {
        if(this.props.error && this.props.error.parcels){
            return <div className="alert alert-danger">
                        <span>Must include at least one share parcel.</span>
                    </div>
        }
    };

    render() {
        return <form className="form" >
        <fieldset>
            <DateInput {...this.formFieldProps('effectiveDate')} time={true}/>
            <WorkingDays field={this.props.fields.noticeDate} source={this.props.fields.effectiveDate.value} days={10} label="Notice must be given to the Registrar by" export={() => {
                return {
                    url: `${window.location.protocol}//${window.location.host}/company/view/${this.props.companyId}`,
                    title: `Notice of Share Issue Due - ${this.props.companyName}`,
                }
            }}/>
             { this.props.fields.parcels.map((p, i) => {
                const onChange = p.shareClass.onChange;
                p.shareClass.onChange = (event) => {
                    if(event.target.value=== CREATE_NEW_SHARE_CLASS){
                        this.props.showNewShareClass(i);
                    }
                    else{
                        onChange(event);
                    }
                }
                return <div className="row " key={i}>
                    <ParcelWithRemove fields={p} remove={() =>
                        this.props.fields.parcels.removeField(i)} shareOptions={this.props.shareOptions} />
                </div>
            }) }
            <div className="button-row"><ButtonInput onClick={() => {
                this.props.fields.parcels.addField();
            }}>Add Parcel</ButtonInput></div>
             </fieldset>
            <fieldset>
            <legend>Shares will be issued to </legend>
             { this.props.fields.holdings.map((p, i) => {
                return <div className="row " key={i}>
                    <HoldingWithRemove fields={p} title={'Shareholders'}
                    remove={() => {
                        this.props.fields.holdings.removeField(i)
                    }}
                    showNewHolding={() => this.props.showNewHolding(i)}
                    shareOptions={this.props.shareOptions}
                    holdingOptions={this.props.holdingOptions}/>
                </div>
            }) }
            <div className="button-row"><ButtonInput onClick={() => {
                this.props.fields.holdings.addField({parcels: [{}]});    // pushes empty child field onto the end of the array
            }}>Add Shareholders</ButtonInput></div>


            { this.props.fields.approvalDocuments.map((p, i) => {
                return <div className="row " key={i}>
                    <ApprovalDocument fields={p} remove={() =>
                        this.props.fields.approvalDocuments.removeField(i)} approvalOptions={this.props.approvalOptions} />
                </div>
            }) }

            <div className="button-row"><ButtonInput onClick={() => {
                this.props.fields.approvalDocuments.addField();
            }}>Add Approval Document</ButtonInput></div>

            <Documents documents={this.props.fields.documents}/>
            { this.renderRemaining() }

        </fieldset>
        </form>
    }
}


export function issueFormatSubmit(values, companyState){
    const actions = [], results = [], newHoldings = [];
    const holdings = companyState.holdingList.holdings.reduce((acc, holding) => {
        acc.amounts[`${holding.holdingId}`] = holding.parcels.reduce((acc, parcel) => {
            acc[parcel.shareClass || undefined] = parcel.amount;
            return acc;
        }, {})

        acc.persons[`${holding.holdingId}`] = holding.holders.map(p => ({
            name: p.person.name, address: p.person.address, personId: p.person.personId, companyNumber: p.person.companyNumber
        }))
        return acc;
    }, {amounts: {}, persons: {}})

    actions.push({
        parcels: values.parcels.map(p => {
            const amount = parseInt(p.amount, 10);
            const shareClass = parseInt(p.shareClass, 10) || null;
            return {
                shareClass: shareClass,
                amount: amount }
        }),
        transactionType: 'ISSUE',
        effectiveDate: values.effectiveDate
    });

    values.holdings.map(h => {
        const persons = holdings.persons[h.holding];
        actions.push({
            parcels: h.parcels.map(p => {
                const beforeAmount = h.newHolding ? 0 : (holdings.amounts[h.holding] || {})[p.shareClass || undefined] || 0;
                const amount = parseInt(p.amount, 10);
                const shareClass = parseInt(p.shareClass, 10) || null;
                return {shareClass: shareClass,
                amount: amount,
                beforeAmount: beforeAmount,
                afterAmount: beforeAmount + amount}
            }),
            holdingId: parseInt(h.holding, 10) || null,
            holders: h.newHolding ? h.newHolding.persons : null,
            afterHolders: persons,
            beforeHolders: persons,
            transactionType: 'ISSUE_TO',
            transactionMethod: h.newHolding ? 'NEW_ALLOCATION' :'AMEND',
            approvalDocuments: values.approvalDocuments,
            noticeDate: values.noticeDate
        });
    });

    results.push({
        effectiveDate: values.effectiveDate,
        transactionType: 'ISSUE',
        actions: actions
    })
    return results;
}

const IssueConnected = reduxForm({
  form: 'issue',
  fields,
  validate,
  destroyOnUnmount: false
})(Issue);

function IssueLawLinks() {
    return <div>
            <LawBrowserLink title="Companies Act 1993" location="s 41" >Issue of shares on registration and amalgamation</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 42" >Issue of shares by the board </LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 43" >Notice of share issue</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 44" >Shareholder approval for share issue</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 45" >Pre-emptive rights</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="ss 46, 46A, 47, and 48" >Consideration for share issue</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 50" >Consent to share issue</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 51" >Time of issue of shares</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 87(2)(c)" >Share issues entered in share register</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 107(2)" >Entitled persons agreement to issue shares</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 117(1) and (3)" >Alteration of shareholder rights by share issue</LawBrowserLink>
    </div>
}


@connect(undefined)
export class IssueTransactionView extends React.Component {
    constructor(props) {
        super(props);
        this.submit = ::this.submit;
        this.handleClose = ::this.handleClose;
        this.handleNext = ::this.handleNext;
    }

    handleNext() {
        this.refs.form.submit();
    }

    handleClose(data = {}) {
        this.props.dispatch(destroy('issue'));
        this.props.end(data);
    }

    submit(values) {
        const transactions = issueFormatSubmit(values, this.props.transactionViewData.companyState)
        if(transactions.length){
            this.props.dispatch(companyTransaction(
                                    'compound',
                                    this.props.transactionViewData.companyId,
                                    {transactions: transactions, documents: values.documents} ))

            .then((results) => {
                this.handleClose({reload: true});
                this.props.dispatch(addNotification({message: 'Shares Issued'}));
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
        const holdingOptions = companyState.holdingList.holdings.map((h, i) => {
                    return <option key={i} value={h.holdingId}>{(h.name ? h.name + ': ' : '') + joinAnd(h.holders.map(h => h.person), {prop: 'name'}) }</option>
                });
        const shareOptions = ((companyState.shareClasses || {}).shareClasses || []).map((s, i) => {
            return <option key={i} value={s.id}>{s.name}</option>
        });
        shareOptions.push(<option key={'new'} value={CREATE_NEW_SHARE_CLASS}>Create new share class</option>)
        const holdingMap = companyState.holdingList.holdings.reduce((acc, val) => {
            acc[`${val.holdingId}`] = val.parcels.map(p => ({ amount: p.amount, shareClass: p.shareClass || undefined }));
            return acc;
        }, {});
        const shareClassMap = generateShareClassMap(companyState);
        return  <IssueConnected ref="form"
                    initialValues={{parcels: [{}], holdings: [{parcels: [{}]}], effectiveDate: new Date() }}
                    holdingOptions={holdingOptions}
                    approvalOptions={approvalOptions}
                    holdingMap={holdingMap}
                    shareOptions={shareOptions}
                    showNewHolding={(index) => this.props.dispatch(showTransactionView('newHolding', {
                        ...this.props.transactionViewData,
                        formName: 'issue',
                        field: `holdings[${index}].newHolding`,
                        afterClose: { // open this transactionView again
                            showTransactionView: {key: 'issue', data: {...this.props.transactionViewData}}
                        }
                    }))}
                    showNewShareClass={(index) => this.props.dispatch(showTransactionView('createShareClass', {
                        ...this.props.transactionViewData,
                        formName: 'issue',
                        field: `holdings[${index}].newHolding`,
                        afterClose: { // open this transactionView again
                            showTransactionView: {key: 'issue', data: {...this.props.transactionViewData}}
                        }
                    }))}
                    companyName={companyState.companyName}
                    companyId={this.props.currentData.companyId}
                    shareClassMap={shareClassMap}
                    onSubmit={this.submit}/>
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'} lawLinks={IssueLawLinks()}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Issue New Shares</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody(this.props.currentData.companyState) }
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={this.handleClose} >Cancel</Button>
                 <Button onClick={this.handleNext} bsStyle="primary">{ 'Submit' }</Button>
              </TransactionView.Footer>
            </TransactionView>
    }

}