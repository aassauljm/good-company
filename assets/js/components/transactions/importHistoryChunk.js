"use strict";
import React, { PropTypes } from 'react';
import { requestResource, createResource, addNotification } from '../../actions';
import { pureRender, stringDateToFormattedString } from '../../utils';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import { Link } from 'react-router'
import STRINGS from '../../strings'
import { asyncConnect } from 'redux-connect';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import TransactionView from '../forms/transactionView';
import { enums as ImportErrorTypes } from '../../../../config/enums/importErrors';
import { enums as TransactionTypes } from '../../../../config/enums/transactions';
import Loading from '../loading'
import { TransactionTerseRenderMap } from '../transaction';


function companiesOfficeDocumentUrl(companyState, documentId){
    const companyNumber = companyState.companyNumber;
    return `http://www.business.govt.nz/companies/app/ui/pages/companies/${companyNumber}/${documentId}/entityFilingRequirement`;
}

function collectPreviousYearsActions(pendingHistory){
    const index = pendingHistory.findIndex(p => p.data.transactionType === TransactionTypes.ANNUAL_RETURN);
    const slice = index > -1 ? pendingHistory.slice(0, index + 1) : pendingHistory;
    return slice.filter(p => p.data.actions && p.data.actions.length);
}


const EXPLAINATION = 0;
const LOADING = 1;
const AMBIGUITY = 2;
const FINISHED = 3;
const CONTINUE = 4;

const PAGES = [];


function TransactionSummaries(props) {
    const pendingActions = [...props.pendingActions];
    pendingActions.reverse();
    return <div>
    <p>If any entry has an Edit button, you can make date and detail corrections.  Once all entries are correct, click 'Confirm Transactions' to move onto the next year.</p>
    <h5 className="text-center">Summary for the period beginning on { stringDateToFormattedString(props.pendingActions[props.pendingActions.length-1].data.effectiveDate) }  </h5>
        <hr/>
        { pendingActions.map((p, i) => {
            const actions = p.data.actions.filter(a => a.transactionType);
            if(!actions.length || isInternalTransaction(p.data.transactionType)){
                return false;
            }
            const editable = isEditable(p.data);
            return <div key={i}>
                <div  className="panel panel-default">
                        <div className="panel-body transaction-table">
                        <div className="col-md-2 transaction-terse-date">
                            { stringDateToFormattedString(p.data.effectiveDate) }
                        </div>
                        <div className="col-md-11">
                        { actions.map((action, i) => {
                            const Terse =  TransactionTerseRenderMap[action.transactionType] || TransactionTerseRenderMap.DEFAULT;
                                return  Terse && <Terse {...action} key={i}/>
                            }) }
                            { /* JSON.stringify(actions) */}
                        </div>
                        <div className="col-md-1">
                        { editable && <div className="button-row"><Button bsStyle="info" onClick={() => props.handleEdit(p, props.pendingActions)}>Edit</Button></div> }
                        </div>
                </div>
                </div>
            </div>
        })}
        <div className="button-row">
        <Button bsStyle="primary" onClick={props.handleConfirm}>Confirm Transactions</Button>
        { false && <Button bsStyle="info" onClick={() => props.handleAddNew(pendingActions)}>Add New Transaction</Button> }
        </div>
    </div>
}

function isEditable(data){
    const actions = data.actions;
    if({[TransactionTypes.INCORPORATION]: true}[data.transactionType]){
        return false;
    }

    const editableTypes = {
        [TransactionTypes.ISSUE_TO]: true,
        [TransactionTypes.AMEND]: true,
        [TransactionTypes.NEW_ALLOCATION]: true,
        [TransactionTypes.REMOVE_ALLOCATION]: true,
        [TransactionTypes.HOLDER_CHANGE]: true,
        [TransactionTypes.TRANSFER_TO]: true,
        [TransactionTypes.TRANSFER_FROM]: true,
        [TransactionTypes.CONVERSION_TO]: true,
        [TransactionTypes.SUBDIVISION_TO]: true,
        [TransactionTypes.UPDATE_DIRECTOR]: true,
        [TransactionTypes.PURCHASE_FROM]: true,
        [TransactionTypes.REDEMPTION_FROM]: true,
        [TransactionTypes.ACQUISITION_FROM]: true,
        [TransactionTypes.CANCELLATION_FROM]: true,
        [TransactionTypes.CONSOLIDATION_FROM]: true,
        [TransactionTypes.UPDATE_DIRECTOR]: true
    };
    return actions.some(a => editableTypes[a.transactionType]);
}

function isInternalTransaction(transactionType){
    return {
        [TransactionTypes.COMPOUND_REMOVALS]: true,
    }[transactionType]
}

PAGES[EXPLAINATION] = function() {
    if(this.props.pendingHistory._status === 'fetching'){
        return  <Loading />
    }

    if(this.props.transactionViewData.companyState.extensive){
        return <div className="alert alert-danger">
        <p>Warning, this company has an extensive shareholdings, meaning full shareholding information is unavailable.  </p>
        <p>We are currently working on tools to enable the creation of a complete share register for an extensive shareholding.</p>
            </div>
    }
    if(this.props.pendingHistory._status === 'complete'){
        const pendingYearActions = collectPreviousYearsActions(this.props.pendingHistory.data);
        if(pendingYearActions.length){
            return <TransactionSummaries pendingActions={pendingYearActions} handleConfirm={this.handleStart} handleAddNew={this.handleAddNew} handleEdit={this.handleEdit} />
        }
    }
    return false;
};

PAGES[LOADING] = function() {
    if(this.props.importHistory._status === 'fetching'){
        return <div>
            <p className="text-center">Importing Transactions</p>
                <Loading />
            </div>
    }
    return false;
};





@connect((state, ownProps) => {
    return {
        pendingHistory: state.resources[`/company/${ownProps.transactionViewData.companyId}/pending_history`] || {},
        importHistory: state.resources[`/company/${ownProps.transactionViewData.companyId}/import_pending_history_until_ar`] || {},
        companyState: state.resources[`/company/${ownProps.transactionViewData.companyId}`] || {},
    };
}, (dispatch, ownProps) => {
    return {
        requestData: () => dispatch(requestResource(`/company/${ownProps.transactionViewData.companyId}/pending_history`)),
        performImport: () => dispatch(createResource(`/company/${ownProps.transactionViewData.companyId}/import_pending_history_until_ar`,
                                                     {}, {
                                                        invalidates: [`/company/${ownProps.transactionViewData.companyId}`, '/alerts']
                                                     })),
        addNotification: (args) => dispatch(addNotification(args)),
    }
})
export class ImportHistoryChunkTransactionView extends React.Component {

    constructor(props){
        super(props);
        this.handleStart = ::this.handleStart;
        this.handleStartYearByYear = ::this.handleStartYearByYear;
        this.handleResolve = ::this.handleResolve;
        this.handleEdit = ::this.handleEdit;
        this.handleAddNew = ::this.handleAddNew
    };

    fetch() {
        return this.props.requestData();
    };

    componentDidMount() {
        this.fetch();
        this.checkContinue();
    };

    componentDidUpdate() {
        this.fetch();
        this.checkContinue();
    };

    checkContinue() {
        if(this.props.index === CONTINUE){
            this.handleStart();
        }
    }

    renderBody() {
        return  PAGES[this.props.index] && PAGES[this.props.index].call(this);
    }

    handleStart() {
        this.props.next({index: LOADING});
        this.props.performImport()
            .then(action => {
                if(!action.response.complete){
                    this.props.next({index: EXPLAINATION});
                }
                else{
                    this.props.end();
                }
            })
            .catch(e => {
                this.handleResolve();
            })
    }

    handleStartYearByYear() {
        this.props.show('importHistoryChunk', {...this.props.transactionViewData});
    }

    handleEdit(actionSet, pendingActions) {
        const otherActions = pendingActions.filter(p => p !== actionSet);
        this.props.show('editTransaction', {...this.props.transactionViewData,
            startId: pendingActions[0].id,
            endId: pendingActions[pendingActions.length-1].previous_id,
            actionSet,
            otherActions,
            afterClose: { showTransactionView: {key: 'importHistoryChunk', data: {...this.props.transactionViewData, index: EXPLAINATION}}}
        });
    }

    handleAddNew(pendingActions) {
        this.props.show('editTransaction', {...this.props.transactionViewData,
            startId: pendingActions[0].id,
            endId: pendingActions[pendingActions.length-1].previous_id,
            otherActions: pendingActions,
            afterClose: { showTransactionView: {key: 'importHistoryChunk', data: {...this.props.transactionViewData, index: EXPLAINATION}}}
        });
    }

    handleResolve() {
        const pendingActions = collectPreviousYearsActions(this.props.pendingHistory.data || []);
        this.props.show('resolveAmbiguity',
            {
                ...this.props.transactionViewData,
                error: this.props.importHistory.error,
                 //open this transactionView again
                afterClose: { showTransactionView: {key: 'importHistoryChunk', data: {...this.props.transactionViewData, index: EXPLAINATION}}},
                editTransactionData: {
                    startId: pendingActions[0].id,
                    endId: pendingActions[pendingActions.length-1].previous_id,
                    pendingActions,
                    afterClose: { showTransactionView: {key: 'importHistoryChunk', data: {...this.props.transactionViewData, index: EXPLAINATION}}}
                }
        });
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Import Company History</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody() }
              </TransactionView.Body>
            </TransactionView>
    }
}
