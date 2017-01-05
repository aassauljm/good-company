"use strict";
import React, {PropTypes} from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Input from './forms/input';
import STRINGS from '../strings'
import { numberWithCommas, stringDateToFormattedString, generateShareClassMap, renderShareClass, joinAnd } from '../utils';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { Link } from 'react-router';
import { deleteResource, addNotification } from '../actions'
import { enums as TransactionTypes } from '../../../config/enums/transactions';
import { companiesOfficeDocumentUrl, holderChange, directorChange, beforeAndAfterSummary } from './transactions/resolvers/summaries';
import { push } from 'react-router-redux'

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

const BaseTransaction = (props) => {
    return <div className="transaction-summary">
        <CommonInfo {...props} />
        { props.children }
    </div>
}

const CommonInfo = (props) => {
    return <div>
            <div className="row">
                <div className="col-md-6 col-md-offset-3">
                    <div className="basic">
                    <div className="transaction-row">
                        <div className="transaction-label">{ STRINGS.transactionTypes._ }</div>
                        <div className="transaction-value">{ STRINGS.transactionTypes[props.type] }</div>
                    </div>
                    <div  className="transaction-row">
                        <div className="transaction-label">{ STRINGS.effectiveDate }</div>
                        <div className="transaction-value">{ stringDateToFormattedString(props.effectiveDate) }</div>
                    </div>

                    { props.data && props.data.documentId && props.companyState && <div  className="transaction-row">
                        <div className="transaction-label">Source Document</div>
                        <div className="transaction-value">
                            <Link target="_blank" rel="noopener noreferrer" className="external-link" to={companiesOfficeDocumentUrl(props.companyState, props.data.documentId)}>{ props.data.label} <Glyphicon glyph="new-window"/></Link>
                        </div>
                        </div> }

                    </div>
                </div>
            </div>
        </div>

}


const BasicLoop = (props) => {
        return <BaseTransaction {...props}>
           { (props.subTransactions || []).map((t, i) => {
                const Comp = TransactionRenderMap[t.type];
                if(Comp){
                    return <Comp key={i} {...t} parentTransaction={props} />
                }
            }).filter(f => f) }
        </BaseTransaction>
}

const HoldingChange = (props) => {
    return beforeAndAfterSummary({actionSet: props.parentTransaction, action: {...props.data, effectiveDate: props.effectiveDate}}, props.companyState, true)
}



//const TerseHolders = (action) => joinAnd(h.holders.map(h => h.person), {prop: 'name'})


export const TransactionTerseRenderMap = {
    ANNUAL_RETURN: (props) => {
        return <span className="transaction-terse">
            { STRINGS.transactionTypes[props.transactionType] }
            </span>
    },
    ADDRESS_CHANGE: (props) => {
        return <span className="transaction-terse">
            { STRINGS.transactionTypes[props.transactionType] }
            <span className="transaction-terse-description"> - { STRINGS[props.field] } changed to { props.newAddress } </span>
            </span>
    },
    UPDATE_DIRECTOR: (props) => {
        return <span className="transaction-terse">
            { STRINGS.transactionTypes[props.transactionType] }
            <span className="transaction-terse-description"> - { props.afterName} </span>
            </span>
    },
    REMOVE_DIRECTOR: (props) => {
        return <span className="transaction-terse">
            { STRINGS.transactionTypes[props.transactionType] }
            <span className="transaction-terse-description"> - { props.name} </span>
            </span>
    },
    NEW_DIRECTOR: (props) => {
        return <span className="transaction-terse">

            { STRINGS.transactionTypes[props.transactionType] }
            <span className="transaction-terse-description"> - { props.name} </span>
            </span>
    },
    NAME_CHANGE: (props) => {
        return <span className="transaction-terse">
            { STRINGS.transactionTypes[props.transactionType] }
            <span className="transaction-terse-description"> - from { props.previousCompanyName} to {props.newCompanyName} </span>
            </span>
    },
    TRANSFER_TO: (props) => {
        return <span className="transaction-terse">
            { STRINGS.amendTypes[props.transactionType] }
            <span className="transaction-terse-description"> - { props.amount } shares to { joinAnd(props.afterHolders || props.holders, {prop: 'name'}) } </span>
            </span>
    },
    ISSUE_TO: (props) => {
        return <span className="transaction-terse">
            { STRINGS.amendTypes[props.transactionType] }
            <span className="transaction-terse-description"> - { props.amount } shares to { joinAnd(props.afterHolders || props.holders, {prop: 'name'}) } </span>
            </span>
    },
    SUBDIVISION_TO: (props) => {
        return <span className="transaction-terse">
            { STRINGS.amendTypes[props.transactionType] }
            <span className="transaction-terse-description"> - { props.amount } shares to { joinAnd(props.afterHolders || props.holders, {prop: 'name'}) } </span>
            </span>
    },
    CONVERSION_TO: (props) => {
        return <span className="transaction-terse">
            { STRINGS.amendTypes[props.transactionType] }
            <span className="transaction-terse-description"> - { props.amount } shares to { joinAnd(props.afterHolders || props.holders, {prop: 'name'}) } </span>
            </span>
    },
    TRANSFER_FROM: (props) => {
        return <span className="transaction-terse">
             { STRINGS.amendTypes[props.transactionType] }
            <span className="transaction-terse-description"> - { props.amount } shares from { joinAnd(props.afterHolders || props.holders, {prop: 'name'}) } </span>
            </span>
    },
    PURCHASE_FROM: (props) => {
        return <span className="transaction-terse">

             { STRINGS.amendTypes[props.transactionType] }
            <span className="transaction-terse-description"> - { props.amount } shares from { joinAnd(props.afterHolders || props.holders, {prop: 'name'}) } </span>
            </span>
    },
    CONSOLIDATION_FROM: (props) => {
        return <span className="transaction-terse">
             { STRINGS.amendTypes[props.transactionType] }
            <span className="transaction-terse-description"> - { props.amount } shares from { joinAnd(props.afterHolders || props.holders, {prop: 'name'}) } </span>
            </span>
    },
    REDEMPTION_FROM: (props) => {
        return <span className="transaction-terse">
             { STRINGS.amendTypes[props.transactionType] }
            <span className="transaction-terse-description"> - { props.amount } shares from { joinAnd(props.afterHolders || props.holders, {prop: 'name'}) } </span>
            </span>
    },
    ACQUISITION_FROM: (props) => {
        return <span className="transaction-terse">
             { STRINGS.amendTypes[props.transactionType] }
            <span className="transaction-terse-description"> - { props.amount } shares from { joinAnd(props.afterHolders || props.holders, {prop: 'name'}) } </span>
            </span>
    },
    DETAILS_MASS: (props) => {
        return <span className="transaction-terse">
             { STRINGS.transactionTypes.INCORPORATION }
            </span>
    },


    DEFAULT: (props) => {
        return <span>
              { STRINGS.transactionTypes[props.transactionType] }
            </span>
    },
}

export const TransactionRenderMap = {
    SEED: () => {

    },

    APPLY_SHARE_CLASSES: (props) => {
        return <BaseTransaction {...props}>
           { (props.subTransactions || []).map((t, i) => {
                const Comp = TransactionRenderMap[t.type];
                if(Comp){
                    return <Comp key={i} {...t} />
                }
            }).filter(f => f) }
        </BaseTransaction>

    },
    APPLY_SHARE_CLASS: (props) => {
        return <div><div className="transaction-row">
            <div className="transaction-label">Share Class Applied</div>
            <div className="transaction-value">HoldingID #{ props.data.holdingId }</div>
            </div>
        </div>

    },

    CREATE_SHARE_CLASS: (props) => {
        return <BaseTransaction {...props}>
        </BaseTransaction>
    },

    SEED: (props) => {
        return <BaseTransaction {...props}>
        </BaseTransaction>
    },

    COMPOUND: BasicLoop,
    ISSUE: BasicLoop,

    HOLDER_CHANGE: (props) => {
        return holderChange({actionSet: props.parentTransaction, action: {...props.data, effectiveDate: props.effectiveDate}})
    },

    UPDATE_DIRECTOR: (props) => {
        return directorChange({actionSet: props.parentTransaction, action: {...props.data, effectiveDate: props.effectiveDate}}, props.companyState, true)
    },

    ISSUE_TO: HoldingChange,
    CONVERSION_TO: HoldingChange,
    SUBDIVISION_TO: HoldingChange,
    ACQUISITION_FROM: HoldingChange,
    PURCHASE_FROM: HoldingChange,
    REDEMPTION_FROM: HoldingChange,
    CONVERSION_TO: HoldingChange,
    CONSOLIDATION_FROM: HoldingChange,
    TRANSFER: BasicLoop,
    TRANSFER_TO: HoldingChange,
    TRANSFER_FROM: HoldingChange
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

    constructor() {
        super();
        this.state = {showingData: false}
    }

    static propTypes = {
        transaction: PropTypes.object.isRequired,
    };

    renderTransaction(transaction) {
        const template = TEMPLATABLE[transaction.type];
        return <div>

            <div className="button-row">
               { template && <Link to={{pathname: `/company/view/${this.props.companyId}/templates/${template.url}`,
                    query: {json: JSON.stringify(template.format(transaction, this.props.companyState))}}}
                    className="btn btn-primary">Transfer Share Form</Link> }
                { this.props.cancel &&  <Button bsStyle="danger" onClick={() => this.props.cancel(transaction.id) }>Cancel Transaction</Button>}
            </div>

            { transaction.documents && transaction.documents.map((d, i) => {
                return <div key={i}><Link to={`/document/view/${d.id}`} onClick={this.props.end}>{ d.filename }</Link></div>
            }) }

            { TransactionRenderMap[transaction.type] && TransactionRenderMap[transaction.type]({...transaction, companyState: this.props.companyState}) }

            <div className="button-row"><Button onClick={() => this.setState({showingData: !this.state.showingData})}>Toggle Data View</Button></div>
            { this.state.showingData && <pre>{JSON.stringify(transaction, null, 4)}</pre> }
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

@connect(undefined, {
    deleteTransaction: (companyId, id) => deleteResource(`/company/${companyId}/transactions/${id}`, {
        confirmation: {
            title: 'Confirm Deletion',
            description: 'Please confirm the cancellation of this transaction',
            resolveMessage: 'Confirm Deletion',
            resolveBsStyle: 'danger'
        },
        loadingMessage: 'Cancelling Transaction'
    }),
    push: (url) => push(url),
    addNotification: (args) => addNotification(args)
})
export class PendingTransactionView extends React.Component {

    constructor() {
        super();
        this.cancel = ::this.cancel;
    }

    cancel(transactionId) {
        this.props.deleteTransaction(this.props.companyId, transactionId)
            .then(() => {
                this.props.push(`/company/view/${this.props.companyId}/upcoming_transactions`);
                this.props.addNotification({message: 'Transaction Cancelled'});
            })
    }

    render() {
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
            return <div>
                <div className="button-row">
                </div>
                <TransactionViewBody transaction={transaction} companyState={this.props.companyState} companyId={this.props.companyId} cancel={this.cancel}/>
                </div>
        }
        else{
            return <div className="loading"></div>
        }
    }
}

