"use strict";
import React, {PropTypes} from 'react';
import Button from 'react-bootstrap/lib/Button';
import Input from './forms/input';
import STRINGS from '../strings'
import { numberWithCommas, stringToDate, generateShareClassMap, renderShareClass } from '../utils';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { Link } from 'react-router';
import { enums as TransactionTypes } from '../../../config/enums/transactions';

const TEMPLATABLE = {
    [TransactionTypes.TRANSFER]: {
        url: 'transfer',
        format: (data, state) => {
            const shareClassMap = generateShareClassMap(state);
            const transferee = data.subTransactions.find(s => s.type === TransactionTypes.TRANSFER_TO);
            const transferor = data.subTransactions.find(s => s.type === TransactionTypes.TRANSFER_FROM);
            const result = {
                company: {
                    companyName: state.companyName,
                    companyNumber: state.companyNumber
                },
                transaction: {
                    amount: transferee.data.amount,
                    shareClass: renderShareClass(transferee.data.shareClass, shareClassMap),
                    effectiveDateString: stringToDate(data.effectiveDate),
                    transferees: (transferee.data.holders || transferee.data.afterHolders)
                        .map(h => ({companyNumber: h.companyNumber || '', name: h.name, address: h.address})),
                    transferors: (transferor.data.holders || transferor.data.afterHolders)
                        .map(h => ({companyNumber: h.companyNumber || '', name: h.name, address: h.address}))
                }
            }
            return result;
        }
    }
}


export class TransactionViewBody extends React.Component {
    static propTypes = {
        transaction: PropTypes.object.isRequired,
    };

    renderTransaction(transaction) {
        const template = TEMPLATABLE[transaction.type];
        return <div>
        { template &&
            <div className="button-row">
                <Link to={{pathname: `/company/view/${this.props.companyId}/templates/${template.url}`,
                    query: {json: JSON.stringify(template.format(transaction, this.props.companyState))}}}
                    className="btn btn-primary">Transfer Share Form</Link>
            </div> }
            { transaction.documents && transaction.documents.map((d, i) => {
                return <div key={i}><Link to={`/document/view/${d.id}`} onClick={this.props.end}>{ d.filename }</Link></div>
            }) }
            <pre>{JSON.stringify(transaction, null, 4)}</pre>
        </div>
    };

    render() {
        return <div>{ this.renderTransaction(this.props.transaction) }</div>
    }
};


export class TransactionView extends React.Component {

    render(){
        const id = this.props.params.transactionId;
        let transaction;
        (this.props.transactions || []).some(t => {
            if(t.transactionId.toString() === id){
                transaction = t;
                return true;
            }
            return (t.subTransactions || []).some(t => {
                if(t.id.toString() === id){
                    transaction = t;
                    return true;
                }
            })
        });
        if(transaction){
            return <TransactionViewBody transaction={transaction} companyState={this.props.companyState} companyId={this.props.companyId} />
        }
        else{
            return <div className="loading"></div>
        }
    }
}


