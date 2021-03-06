"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Input from './forms/input';
import STRINGS from '../strings'
import { numberWithCommas, stringDateToFormattedString, generateShareClassMap, renderShareClass, joinAnd } from '../utils';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { Link } from 'react-router';
import { deleteResource, addNotification } from '../actions'
import { enums as TransactionTypes } from '../../../config/enums/transactions';
import { actionAmountDirection } from './transactions/resolvers/summaries';
import { companiesOfficeDocumentUrl, holderChange, directorChange, beforeAndAfterSummary, holdingChangeSummary, addressChange, nameChange, addRemoveDirector, arFilingChange } from './transactions/resolvers/summaries';
import { push } from 'react-router-redux'
import { ARSummary } from './annualReturn'
import TEMPLATABLE from './templates/templatable';


const BaseTransaction = (props) => {
    return <div className="transaction-summary">
        { !props.noSummary && <CommonInfo {...props} /> }
        { props.children }
    </div>
}


const CommonInfo = (props) => {
    return <div className="row">
                <div className="col-md-6 col-md-offset-3">
                    <div className="basic">

                    <div className="transaction-row">
                        <div className="transaction-label">{ STRINGS.transactionTypes._ }</div>
                        <div className="transaction-value">{ STRINGS.transactionTypes[props.type || props.transactionType] }</div>
                    </div>

                    <div className="transaction-row">
                        <div className="transaction-label">{ STRINGS.effectiveDate }</div>
                        <div className="transaction-value">{ stringDateToFormattedString(props.effectiveDate) }</div>
                    </div>

                    { props.data && props.data.documentId && props.companyState && <div  className="transaction-row">
                        <div className="transaction-label">Source Document</div>
                        <div className="transaction-value">
                            <Link target="_blank" rel="noopener noreferrer" className="external-link"
                                to={companiesOfficeDocumentUrl(props.companyState, props.data.documentId)}>{ props.data.label} <Glyphicon glyph="new-window"/></Link>
                        </div>
                        </div> }

                    </div>
                </div>
            </div>
}


const BasicLoop = (props) => {
        return <BaseTransaction {...props}>
           { (props.subTransactions || []).map((t, i) => {
                const Comp = TransactionRenderMap[t.type];
                if(Comp){
                    return <Comp key={i} {...t} parentTransaction={props} companyState={props.companyState} shareClassMap={props.shareClassMap} noSummary={true}/>
                }
            }).filter(f => f) }
           { props.children }
        </BaseTransaction>
}

const ShareHoldingChange = (props) => {
    return beforeAndAfterSummary({actionSet: props.parentTransaction, action: {...props.data, effectiveDate: props.effectiveDate}, shareClassMap: props.shareClassMap}, props.companyState, true)
}




const amendTo =  props =>
    <span className="transaction-terse">
             { props.userSkip && <span className="transaction-terse-skip">SKIPPED</span> }
            { STRINGS.amendTypes[props.transactionType] }
            <span className="transaction-terse-description"> - { props.parcels.map(p => `${props.inferAmount ? 'All' : numberWithCommas(p.amount)} ${renderShareClass(p.shareClass,  props.shareClassMap)}`).join(', ') } shares to { joinAnd(props.afterHolders || props.holders, {prop: 'name'}) } </span>
    </span>;

const amendFrom = props =>
            <span className="transaction-terse">
             { props.userSkip && <span className="transaction-terse-skip">SKIPPED</span> }
            { STRINGS.amendTypes[props.transactionType] }
            <span className="transaction-terse-description"> - {  props.parcels.map(p => `${props.inferAmount ? 'All' : numberWithCommas(p.amount)} ${renderShareClass(p.shareClass,  props.shareClassMap)}`).join(', ')} shares from { joinAnd(props.afterHolders || props.holders, {prop: 'name'}) } </span>
    </span>;

const shareChange = props =>
            <span className="transaction-terse">
             { props.userSkip && <span className="transaction-terse-skip">SKIPPED</span> }
            { STRINGS.transactionTypes[props.transactionType] }
            <span className="transaction-terse-description"> - { props.parcels.map(p => `${numberWithCommas(p.amount)} shares`).join(', ') } (Update to { numberWithCommas(props.parcels.reduce((sum, p) => sum + p.afterAmount, 0)) } total shares) </span>
    </span>;


export const TransactionTerseRenderMap = {
    [TransactionTypes.ANNUAL_RETURN]: (props) => {
        return <span className="transaction-terse">
             { props.userSkip && <span className="transaction-terse-skip">SKIPPED</span> }
            { STRINGS.transactionTypes[props.transactionType] }
            </span>
    },
    [TransactionTypes.ADDRESS_CHANGE]: (props) => {
        return <span className="transaction-terse">
         { props.userSkip && <span className="transaction-terse-skip">SKIPPED</span> }
            { STRINGS.transactionTypes[props.transactionType] }
            { props.newAddress && <span className="transaction-terse-description"> - { STRINGS[props.field] } changed to { props.newAddress } </span> }
            { !props.newAddress && <span className="transaction-terse-description"> - { STRINGS[props.field] } removed </span> }
            </span>
    },
    [TransactionTypes.UPDATE_DIRECTOR]: (props) => {
        return <span className="transaction-terse">
             { props.userSkip && <span className="transaction-terse-skip">SKIPPED</span> }
            { STRINGS.transactionTypes[props.transactionType] }
            <span className="transaction-terse-description"> - { props.afterName} </span>
            </span>
    },
    [TransactionTypes.REMOVE_DIRECTOR]: (props) => {
        return <span className="transaction-terse">
         { props.userSkip && <span className="transaction-terse-skip">SKIPPED</span> }
            { STRINGS.transactionTypes[props.transactionType] }
            <span className="transaction-terse-description"> - { props.name} </span>
            </span>
    },
    [TransactionTypes.NEW_DIRECTOR]: (props) => {
        return <span className="transaction-terse">
         { props.userSkip && <span className="transaction-terse-skip">SKIPPED</span> }
            { STRINGS.transactionTypes[props.transactionType] }
            <span className="transaction-terse-description"> - { props.name} </span>
            </span>
    },
    [TransactionTypes.NAME_CHANGE]: (props) => {
        return <span className="transaction-terse">
         { props.userSkip && <span className="transaction-terse-skip">SKIPPED</span> }
            { STRINGS.transactionTypes[props.transactionType] }
            <span className="transaction-terse-description"> - from { props.previousCompanyName} to {props.newCompanyName} </span>
            </span>
    },
    [TransactionTypes.HOLDER_CHANGE]: (props) => {
        return <span className="transaction-terse">
         { props.userSkip && <span className="transaction-terse-skip">SKIPPED</span> }
            { STRINGS.transactionTypes[props.transactionType] }
            <span className="transaction-terse-description"> - { props.afterHolder.name } </span>
            </span>
    },
    [TransactionTypes.TRANSFER_TO]: amendTo,
    [TransactionTypes.ISSUE_TO]: amendTo,
    [TransactionTypes.ISSUE]: shareChange,
    [TransactionTypes.CONSOLIDATION]: shareChange,
    [TransactionTypes.REDEMPTION]:shareChange,
    [TransactionTypes.CONVERSION]: shareChange,
    [TransactionTypes.SUBDIVISION]: shareChange,
    [TransactionTypes.ACQUISITION]: shareChange,
    [TransactionTypes.PURCHASE]: shareChange,

    [TransactionTypes.SUBDIVISION_TO]: amendTo,
    [TransactionTypes.CONVERSION_TO]: amendTo,
    [TransactionTypes.NEW_ALLOCATION]: amendTo,
    [TransactionTypes.TRANSFER_FROM]: amendFrom,
    [TransactionTypes.PURCHASE_FROM]: amendFrom,
    [TransactionTypes.CONSOLIDATION_FROM]: amendFrom,
    [TransactionTypes.REDEMPTION_FROM]: amendFrom,
    [TransactionTypes.ACQUISITION_FROM]: amendFrom,
    [TransactionTypes.CANCELLATION_FROM]: amendFrom,

    [TransactionTypes.AMEND]: (props) => actionAmountDirection(props) ? amendTo(props) : amendFrom(props),

    [TransactionTypes.DETAILS_MASS]: (props) => {
        return <span className="transaction-terse">
          { props.userSkip && <span className="transaction-terse-skip">SKIPPED</span> }
             { STRINGS.transactionTypes.INCORPORATION }
            </span>
    },

    DEFAULT: (props) => {
        return <span className="transaction-terse">
          { props.userSkip && <span className="transaction-terse-skip">SKIPPED</span> }
              { STRINGS.transactionTypes[props.transactionType] }
            </span>
    },
}

export const TransactionRenderMap = {
    [TransactionTypes.SEED]: () => {

    },

    [TransactionTypes.APPLY_SHARE_CLASSES]: (props) => {
        return <BaseTransaction {...props}>
           { (props.subTransactions || []).map((t, i) => {
                const Comp = TransactionRenderMap[t.type];
                if(Comp){
                    return <Comp key={i} {...t} />
                }
            }).filter(f => f) }
        </BaseTransaction>

    },
    [TransactionTypes.APPLY_SHARE_CLASS]: (props) => {
        return <div><div className="transaction-row">
            <div className="transaction-label">Share Class Applied</div>
            <div className="transaction-value">HoldingID #{ props.data.holdingId }</div>
            </div>
        </div>

    },

    [TransactionTypes.CREATE_SHARE_CLASS]: (props) => {
        return <BasicLoop {...props}>
          { props.data.name && <div className="transaction-row">
             <div className="transaction-label">Share Class Created</div>
             <div className="transaction-value">{ props.data.name }</div>
            </div> }
        </BasicLoop>
    },

    [TransactionTypes.SEED]: (props) => {
        return <BaseTransaction {...props}>

        </BaseTransaction>
    },

    [TransactionTypes.ANNUAL_RETURN]: (props) => {
        const companyState = props.data.holdings && {
            ...props.data,
            holdingList: {holdings: props.data.holdings.map(h => {
                return {...h, holders: h.holders.map((h) => ({person: h}))}
            })},
            directorList: {directors: props.data.directors.map(d => {
                return {...d, person: d}
            })}
        }
        if(companyState){
            return <ARSummary companyState={props.companyState} />;
        }
        return <BasicLoop {...props} />
    },

    [TransactionTypes.UPDATE_SOURCE_DOCUMENTS]: BasicLoop,
    [TransactionTypes.COMPOUND]: BasicLoop,
    [TransactionTypes.INCORPORATION]: BasicLoop,

    [TransactionTypes.ISSUE]: BasicLoop,
    [TransactionTypes.CONSOLIDATION]: BasicLoop,
    [TransactionTypes.REDEMPTION]: BasicLoop,
    [TransactionTypes.CONVERSION]: BasicLoop,
    [TransactionTypes.SUBDIVISION]: BasicLoop,
    [TransactionTypes.ACQUISITION]: BasicLoop,
    [TransactionTypes.PURCHASE]: BasicLoop,
    [TransactionTypes.DETAILS]: BasicLoop,

    [TransactionTypes.HOLDING_TRANSFER]: BasicLoop,

    [TransactionTypes.HOLDER_CHANGE]: (props) => {
        return props.subTransactions ? BasicLoop(props) : holderChange({actionSet: props.parentTransaction, action: {...props.data, effectiveDate: props.effectiveDate}})
    },

    [TransactionTypes.UPDATE_DIRECTOR]: (props) => {
        return  props.subTransactions ? BasicLoop(props) : directorChange({actionSet: props.parentTransaction, action: {...props.data, effectiveDate: props.effectiveDate}}, props.companyState, true)
    },

    [TransactionTypes.NEW_DIRECTOR]: (props) => {
        return  props.subTransactions ? BasicLoop(props) : addRemoveDirector({actionSet: props.parentTransaction, action: {...props.data, effectiveDate: props.effectiveDate}}, props.companyState, true)
    },

    [TransactionTypes.REMOVE_DIRECTOR]: (props) => {
        return  props.subTransactions ? BasicLoop(props) : addRemoveDirector({actionSet: props.parentTransaction, action: {...props.data, effectiveDate: props.effectiveDate}}, props.companyState, true)
    },

    [TransactionTypes.ISSUE_TO]: ShareHoldingChange,
    [TransactionTypes.CONVERSION_TO]: ShareHoldingChange,
    [TransactionTypes.SUBDIVISION_TO]: ShareHoldingChange,
    [TransactionTypes.ACQUISITION_FROM]: ShareHoldingChange,
    [TransactionTypes.PURCHASE_FROM]: ShareHoldingChange,
    [TransactionTypes.REDEMPTION_FROM]: ShareHoldingChange,
    [TransactionTypes.CONSOLIDATION_FROM]: ShareHoldingChange,
    [TransactionTypes.NAME_CHANGE]: (props) => {
        return nameChange({actionSet: props.parentTransaction, action: {...props.data, effectiveDate: props.effectiveDate}}, props.companyState, true)
    },
    [TransactionTypes.ADDRESS_CHANGE]: (props) => {
        return props.subTransactions ? BasicLoop(props) : addressChange({actionSet: props.parentTransaction, action: {...props.data, effectiveDate: props.effectiveDate}}, props.companyState, true)
    },

    [TransactionTypes.INFERRED_REMOVE_DIRECTOR]: BasicLoop,
    [TransactionTypes.INFERRED_NEW_DIRECTOR]: BasicLoop,
    [TransactionTypes.INFERRED_UPDATE_DIRECTOR]: BasicLoop,

    [TransactionTypes.TRANSFER]: BasicLoop,
    [TransactionTypes.TRANSFER_TO]: ShareHoldingChange,
    [TransactionTypes.TRANSFER_FROM]: ShareHoldingChange,
    [TransactionTypes.HOLDING_CHANGE]: (props) => {
        return props.subTransactions ? BasicLoop(props) : holdingChangeSummary({actionSet: props.parentTransaction, action: {...props.data, effectiveDate: props.effectiveDate}}, props.companyState, true)
    },
    [TransactionTypes.AR_FILING_CHANGE]: (props) => {
        return props.subTransactions ? BasicLoop(props) : arFilingChange({actionSet: props.parentTransaction, action: {...props.data, effectiveDate: props.effectiveDate}}, props.companyState, true)
    }
}


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
                    className="btn btn-primary">Share Transfer Form</Link> }
                { this.props.cancel &&  <Button bsStyle="danger" onClick={() => this.props.cancel(transaction.id) }>Cancel Transaction</Button>}
            </div>
             { (template || this.props.cancel) && <hr/> }
            { transaction.documents && transaction.documents.map((d, i) => {
                return <div key={i}><Link to={`/documents/view/${d.id}`} onClick={this.props.end}>{ d.filename }</Link></div>
            }) }

            { TransactionRenderMap[transaction.type] && TransactionRenderMap[transaction.type]({...transaction, companyState: this.props.companyState, shareClassMap: this.props.shareClassMap}) }

             { false &&  <div className="button-row"><Button onClick={() => this.setState({showingData: !this.state.showingData})}>Toggle Data View</Button></div> }
            { this.state.showingData && <pre>{JSON.stringify(transaction, null, 4)}</pre> }
                <hr/>
                <div className="button-row">
            <Link className="btn btn-default transaction-return" to={`/company/view/${this.props.companyId}/transactions`}>View All Transactions</Link>
            </div>
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
            const shareClassMap = generateShareClassMap(this.props.companyState);
            return <TransactionViewBody transaction={transaction} companyState={this.props.companyState} companyId={this.props.companyId} shareClassMap={shareClassMap}/>
        }
        else{
            return <div className="loading"></div>
        }
    }
}

@connect(undefined, {
    deleteTransaction: (companyId, ids) => deleteResource(`/company/${companyId}/transactions/${ids}`, {
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

