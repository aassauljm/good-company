"use strict";
import React, {PropTypes} from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from '../forms/input';
import STRINGS from '../../strings'
import { numberWithCommas, fieldStyle, fieldHelp  } from '../../utils'
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { Link } from 'react-router';
import { companyTransaction, addNotification, showTransactionView } from '../../actions';
import { push } from 'react-router-redux';
import Loading from '../loading';
import { ParcelWithRemove } from '../forms/parcel';
import { enums as TransactionTypes } from '../../../../config/enums/transactions';


function renderHolders(holding){
    return <ul>
        { holding.holders.map((h, i) => {
            return <li key={i}>{ h.person.name } </li>
        })}
    </ul>
}

function renderAmount(holding){
    return <ul>
        { holding.parcels.map((h, i) => {
            return <li key={i}>{ numberWithCommas(h.amount) } </li>
        })}
    </ul>
}


export class ShareClassSelect extends React.Component {

    static propTypes = {
        shareOptions: PropTypes.array.isRequired,
    }

    renderSelect(parcels) {
        return parcels.map((s, i) => {
            const props = {};
            if(parcels.length > 1){
                props.remove = () => parcels.removeField(i);
            }
            if(this.props.shareOptions.length > 1 && parcels.length < this.props.shareOptions.length ){
                props.add = () => parcels.addField({shareClass: s.shareClass.value});
            }
            return <div key={i}><ParcelWithRemove {...s} {...props} shareOptions={this.props.shareOptions} forceShareClass={true}/></div>
        });
    }

    render() {
        return <table className="table table-striped">
            <thead>
            <tr><th>Name</th><th>Shareholders</th><th>Total Shares</th><th className="text-center">Share Classes</th></tr>
            </thead>
            <tbody>
                { this.props.fields.holdings.map((holding, i) => {
                    const h = this.props.holdings[i];
                    return <tr key={i}>
                        <td>{ h.name }</td>
                        <td>{ renderHolders(h) }</td>
                        <td>{ renderAmount(h) }</td>
                        <td>{ this.renderSelect(holding.parcels) }</td>
                    </tr>
                })}
            </tbody>
        </table>
    }
}

function validate(values, props) {
    const errors = {holdings: values.holdings.map((h,i ) => {
        let sum = 0;
        const target = props.holdings[i].parcels.reduce((sum, p) => sum + p.amount, 0);
        const classes = {};
        return {parcels: h.parcels.map((p, j) => {
            const amount = parseInt(p.amount, 10) || 0;
            const errors = {};
            if(!amount){
                errors.amount = ['Required']
            }
            if(amount < 0){
                errors.amount = ['Must be greater than 0']
            }
            sum += amount;
            if(sum > target){
                errors.amount = [`Amount greater than total`]
            }
            if(j === h.parcels.length-1 && sum < target){
                errors.amount = [`Amount less than total`]
            }
            if(!p.shareClass){
                errors.shareClass = ['Required']
            }
            if(classes[p.shareClass]){
                errors.shareClass = ['Duplicate share class']
            }
            classes[p.shareClass] = true;
            return errors;
        })}
    })};
    return errors;
}

const fields = [
    'holdings[].parcels[].shareClass',
    'holdings[].parcels[].amount'
];


const ShareClassSelectConnected = reduxForm({
  form: 'shareClassSelect',
  fields,
  validate
})(ShareClassSelect);


@connect((state) => ({transactions: state.transactions}))
export class ApplyShareClassesTransactionView extends React.Component {
    constructor(props) {
        super(props);
         this.submit = ::this.submit;
    }

    handleNext() {
        this.refs.form.submit();
    }

    submit(values) {
        if(this.props.transactions._status === 'fetching'){
            return false;
        }
        const companyState = this.props.transactionViewData.companyState;
        const holdings = companyState.holdingList.holdings;
        const actions = values.holdings.map((h, i) => {
            return {
                holdingId: holdings[i].holdingId,
                parcels: h.parcels.map(p => ({amount: parseInt(p.amount), shareClass: parseInt(p.shareClass)})),
                transactionType: TransactionTypes.APPLY_SHARE_CLASS
            }
        });
        this.props.dispatch(companyTransaction('apply_share_classes',
                                this.props.transactionViewData.companyId,
                                {actions: actions}, {skipConfirmation: true}))
            .then(() => {
                this.props.end({reload: true});
                this.props.dispatch(addNotification({message: 'Share classes applied.'}));
            })
            .catch((err) => {
                this.props.dispatch(addNotification({message: err.message, error: true}));
            });
    }

    renderBody(companyState) {
        if(this.props.transactions._status === 'fetching'){
            return <Loading />
        }
        const shareClasses = ((companyState.shareClasses || {}).shareClasses || []);
        const options = shareClasses.map((s, i) => {
            return <option key={i} value={s.id}>{s.name}</option>
        })
        const defaultShareClass = (shareClasses[shareClasses.length-1] || {}).id;

        const initialValues = {holdings: companyState.holdingList.holdings.map((value, key) => {
            return {parcels: value.parcels.map(p => ({shareClass: (p.shareClass || defaultShareClass) + '', amount: p.amount })) }
        })};

        return <ShareClassSelectConnected
            ref="form"
            holdings={companyState.holdingList.holdings}
            shareOptions={options}
            onSubmit={this.submit}
            initialValues={initialValues}/>
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Apply Share Classes</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody(this.props.transactionViewData.companyState) }
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={() => this.props.show('manageShareClasses')} bsStyle="success">Manage Share Classes</Button>
                <Button onClick={() => this.props.end({cancelled: true})} >Cancel</Button>
                 <Button onClick={::this.handleNext} bsStyle="primary" className="submit">{ 'Submit' }</Button>
              </TransactionView.Footer>
            </TransactionView>
    }
}