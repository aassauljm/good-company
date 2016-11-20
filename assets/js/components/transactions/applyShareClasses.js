"use strict";
import React, {PropTypes} from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from '../forms/input';
import STRINGS from '../../strings'
import { numberWithCommas } from '../../utils'
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { fieldStyle, fieldHelp } from '../../utils';
import { Link } from 'react-router';
import { companyTransaction, addNotification, showTransactionView } from '../../actions';
import { push } from 'react-router-redux';
import Loading from '../loading';


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
        options: PropTypes.array.isRequired,
    }

    renderSelect(shareClass) {
        return <Input type="select" {...shareClass} bsStyle={fieldStyle(shareClass)} help={fieldHelp(shareClass)}
            hasFeedback >
                <option></option>
                { this.props.options }
            </Input>
    }

    render() {
        return <table className="table table-striped">
            <thead>
            <tr><th>Name</th><th>Shareholders</th><th>Shares</th><th>Share Class</th></tr>
            </thead>
            <tbody>
                { this.props.companyState.holdingList.holdings.map((h, i) => {
                    return <tr key={i}>
                        <td>{ h.name }</td>
                        <td>{ renderHolders(h) }</td>
                        <td>{ renderAmount(h) }</td>
                        <td>{ this.renderSelect(this.props.fields[`${h.holdingId}`]) }</td>
                    </tr>
                })}
            </tbody>
        </table>
    }
}

function validate(values) {
    return Object.keys(values).reduce((acc, k) => {
        if(!values[k]){
            acc[k] =  ['Required']
        }
        return acc;
    }, {});
}

const ShareClassSelectConnected = reduxForm({
  form: 'shareClassSelect',
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
        const holdings = [];
        Object.keys(values).map(k => {
            holdings.push({
                holdingId: parseInt(k, 10),
                shareClass: parseInt(values[k], 10) || undefined,
                transactionType: 'APPLY_SHARE_CLASS'
            });
        });
        this.props.dispatch(companyTransaction('apply_share_classes',
                                this.props.transactionViewData.companyId,
                                {actions: holdings}, {skipConfirmation: true}))
            .then(() => {
                this.props.end({reload: true});
                this.props.dispatch(addNotification({message: 'Share classes applied.'}));
            })
            .then(() => {
                //this.props.show('importHistory', {companyState: this.props.transactionViewData.companyState, companyId: this.props.transactionViewData.companyId});
                //this.props.dispatch(push(`/company/view/${this.props.transactionViewData.companyId}/new_transaction`));
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
        const fields = companyState.holdingList.holdings.map(h => `${h.holdingId}`)
        const initialValues = companyState.holdingList.holdings.reduce((acc, value, key) => {
            acc[value.holdingId] = value.parcels[0].shareClass || (shareClasses[shareClasses.length-1] || {}).id;
            return acc;
        }, {})
        return <ShareClassSelectConnected
            ref="form"
            companyState={companyState}
            options={options}
            fields={fields}
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
                <Button onClick={this.props.end} >Cancel</Button>
                 <Button onClick={::this.handleNext} bsStyle="primary" className="submit">{ 'Submit' }</Button>
              </TransactionView.Footer>
            </TransactionView>
    }
}