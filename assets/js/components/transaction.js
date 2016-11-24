"use strict";
import React, {PropTypes} from 'react';
import Button from 'react-bootstrap/lib/Button';
import Input from './forms/input';
import STRINGS from '../strings'
import { numberWithCommas, stringDateToFormattedString, generateShareClassMap, renderShareClass } from '../utils';
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
                    effectiveDateString: stringDateToFormattedString(data.effectiveDate),
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

const CommonInfo = (props) => {

}


export const TransactionRenderMap = {
    SEED: () => {

    },

    APPLY_SHARE_CLASSES: () => {

    }


}
/*

    SEED: 'SEED',
    INCORPORATION: 'INCORPORATION',

    ISSUE: 'ISSUE',
    ISSUE_TO: 'ISSUE_TO',

    CONVERSION: 'CONVERSION',
    CONVERSION_TO: 'CONVERSION_TO',

    SUBDIVISION: 'SUBDIVISION',
    SUBDIVISION_TO: 'SUBDIVISION_TO',

    PURCHASE: 'PURCHASE',
    PURCHASE_FROM: 'PURCHASE_FROM',

    REDEMPTION: 'REDEMPTION',
    REDEMPTION_FROM: 'REDEMPTION_FROM',

    ACQUISITION: 'ACQUISITION',
    ACQUISITION_FROM: 'ACQUISITION_FROM',

    CONSOLIDATION: 'CONSOLIDATION',
    CONSOLIDATION_FROM: 'CONSOLIDATION_FROM',

    AMEND: 'AMEND',
    COMPOUND: 'COMPOUND',
    NEW_ALLOCATION: 'NEW_ALLOCATION',
    REMOVE_ALLOCATION: 'REMOVE_ALLOCATION',
    DETAILS: 'DETAILS',
    DETAILS_MASS: 'DETAILS_MASS',
    NAME_CHANGE: 'NAME_CHANGE',
    ADDRESS_CHANGE: 'ADDRESS_CHANGE',
    USER_FIELDS_CHANGE: 'USER_FIELDS_CHANGE',
    HOLDING_CHANGE: 'HOLDING_CHANGE',
    HOLDING_TRANSFER: 'HOLDING_TRANSFER',
    HOLDER_CHANGE: 'HOLDER_CHANGE',

    TRANSFER: 'TRANSFER',
    TRANSFER_TO: 'TRANSFER_TO',

    TRANSFER_FROM: 'TRANSFER_FROM',
    ANNUAL_RETURN: 'ANNUAL_RETURN',
    NEW_DIRECTOR: 'NEW_DIRECTOR',

    REMOVE_DIRECTOR: 'REMOVE_DIRECTOR',
    UPDATE_DIRECTOR: 'UPDATE_DIRECTOR',


    REGISTER_ENTRY: 'REGISTER_ENTRY',
    CREATE_SHARE_CLASS: 'CREATE_SHARE_CLASS',
    APPLY_SHARE_CLASS: 'APPLY_SHARE_CLASS',
    APPLY_SHARE_CLASSES: 'APPLY_SHARE_CLASSES',

    COMPOUND_REMOVALS: 'COMPOUND_REMOVALS',

    INFERRED_UPDATE_DIRECTOR: 'INFERRED_UPDATE_DIRECTOR',
    INFERRED_HOLDER_CHANGE: 'INFERRED_HOLDER_CHANGE',
    INFERRED_NEW_DIRECTOR: 'INFERRED_NEW_DIRECTOR',
    INFERRED_REMOVE_DIRECTOR: 'INFERRED_REMOVE_DIRECTOR',
    INFERRED_INTRA_ALLOCATION_TRANSFER: 'INFERRED_INTRA_ALLOCATION_TRANSFER',

    HISTORIC_HOLDER_CHANGE: 'HISTORIC_HOLDER_CHANGE',

    UPLOAD_DOCUMENT: 'UPLOAD_DOCUMENT',
    UPDATE_DOCUMENT: 'UPDATE_DOCUMENT',
    CREATE_DIRECTORY: 'CREATE_DIRECTORY',
}};

*/

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
            if(t.id.toString() === id){
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


