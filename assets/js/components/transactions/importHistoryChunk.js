"use strict";
import React, { PropTypes } from 'react';
import { requestResource, createResource, updateResource, addNotification } from '../../actions';
import { pureRender, stringDateToFormattedString } from '../../utils';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import { Link } from 'react-router'
import STRINGS from '../../strings'
import { asyncConnect } from 'redux-connect';
import { reduxForm, destroy } from 'redux-form';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import TransactionView from '../forms/transactionView';
import { enums as ImportErrorTypes } from '../../../../config/enums/importErrors';
import { enums as TransactionTypes } from '../../../../config/enums/transactions';
import Loading from '../loading'
import { TransactionTerseRenderMap } from '../transaction';
import Shuffle from 'react-shuffle';

function companiesOfficeDocumentUrl(companyState, documentId){
    const companyNumber = companyState.companyNumber;
    return `http://www.business.govt.nz/companies/app/ui/pages/companies/${companyNumber}/${documentId}/entityFilingRequirement`;
}

function collectChunkedActions(pendingHistory){
    return pendingHistory;
}


const EXPLAINATION = 0;
const LOADING = 1;
const AMBIGUITY = 2;
const FINISHED = 3;
const CONTINUE = 4;

const PAGES = [];


function TransactionSummaries(props) {
    const pendingActions = props.pendingActions.filter(p => {
        const actions = p.data.actions.filter(a => a.transactionType);
        if(!actions.length || isNonDisplayedTransaction(p.data.transactionType)){
            return false;
        }
        if(actions.every(a => a.userConfirmed)){
            return false;
        }
        return true;
    });

    return <div>
        <p>Please Confirm or Edit the transactions listed below.  Entries shown in red will require your manual reconciliation.  Please note that even confirmed transactions may require corrections.</p>
        <hr/>
        <Shuffle >
            { pendingActions.map((p, i) => {
                const editable = isEditable(p.data);
                const required = requiresEdit(p.data);
                const showConfirm = !required;

                let className = "panel panel-default"
                if(required){
                    className = "panel panel-danger"
                }
                return <div key={p.id}>
                        <div  className={className}>
                            <div className="panel-heading">
                                <div className="row transaction-table">
                                    <div className="transaction-terse-date col-md-2">
                                        { stringDateToFormattedString(p.data.effectiveDate) }
                                    </div>
                                    <div className="col-md-8">
                                    { p.data.actions.map((action, i) => {
                                        const Terse =  TransactionTerseRenderMap[action.transactionType] || TransactionTerseRenderMap.DEFAULT;
                                            return  Terse && <Terse {...action} key={i}/>
                                        }) }
                                    </div>
                                    <div className="col-md-1">{ editable && <div className="button-row"><Button bsStyle="info" onClick={() => props.handleEdit(p, props.pendingActions)}>Edit</Button></div> }</div>
                                    <div className="col-md-1"> { showConfirm &&  <div className="button-row"><Button bsStyle="success" onClick={() => props.handleConfirm(p, pendingActions.slice(0, i) ) }>Confirm</Button></div> }</div>
                                </div>
                            </div>
                            </div>
                        </div>
            }) }
        </Shuffle>
        <div className="button-row">
        <Button onClick={() => props.end({cancelled: true})}>Cancel</Button>
        <Button bsStyle="primary" className="submit-import" onClick={props.handleConfirm}>Confirm All Transactions</Button>
         { false && <Button bsStyle="info" onClick={() => props.handleAddNew(pendingActions)}>Add New Transaction</Button> }
        </div>
    </div>
}

function requiresEdit(data){
    const actions = data.actions;

    const requiredTypes = {
        [TransactionTypes.AMEND]: true,
        [TransactionTypes.NEW_ALLOCATION]: true,
        [TransactionTypes.REMOVE_ALLOCATION]: true
    };
    return actions.some(a => requiredTypes[a.transactionType]);
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

function isNonDisplayedTransaction(transactionType){
    return {
        [TransactionTypes.COMPOUND_REMOVALS]: true,
        [TransactionTypes.ANNUAL_RETURN]: true,
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
        const pendingYearActions = collectChunkedActions(this.props.pendingHistory.data);
        if(pendingYearActions.length){
            return <TransactionSummaries
                pendingActions={pendingYearActions}
                handleConfirm={this.handleStart}
                handleAddNew={this.handleAddNew}
                handleEdit={this.handleEdit}
                end={this.props.end}
                handleConfirm={this.handleConfirm}
                />
        }
        else{
           return <div>
                <p>All Companies Office documents have successfully been imported.</p>
            </div>
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
    else if(this.props.importHistory._status === 'complete'){
       return <div>
        <p>All Companies Office documents have successfully been imported.</p>
        </div>
    }

};





@connect((state, ownProps) => {
    return {
        pendingHistory: state.resources[`/company/${ownProps.transactionViewData.companyId}/pending_history`] || {},
        importHistory: state.resources[`/company/${ownProps.transactionViewData.companyId}/import_pending_history`] || {},
        companyState: state.resources[`/company/${ownProps.transactionViewData.companyId}`] || {},
    };
}, (dispatch, ownProps) => {
    return {
        requestData: () => dispatch(requestResource(`/company/${ownProps.transactionViewData.companyId}/pending_history`)),
        performImport: () => dispatch(createResource(`/company/${ownProps.transactionViewData.companyId}/import_pending_history`,
                                                     {}, {
                                                        invalidates: [`/company/${ownProps.transactionViewData.companyId}`, '/alerts']
                                                     })),
        performImportUntil: (id) => dispatch(createResource(`/company/${ownProps.transactionViewData.companyId}/import_pending_history_until`,
                                                     {id}, {
                                                        invalidates: [`/company/${ownProps.transactionViewData.companyId}`, '/alerts']
                                                     })),
        addNotification: (args) => dispatch(addNotification(args)),
        destroyForm: (args) => dispatch(destroy(args)),
        updateAction: (args) => {
            return dispatch(updateResource(`/company/${ownProps.transactionViewData.companyId}/update_pending_history`, args, {
                invalidates: [`/company/${ownProps.transactionViewData.companyId}/import_pending_history`]
            }))
            .then(() => {
                dispatch(destroy('amend'));
                ownProps.end();
            })
        },
    }
})
export class ImportHistoryChunkTransactionView extends React.Component {

    constructor(props){
        super(props);
        this.handleStart = ::this.handleStart;
        this.handleStartYearByYear = ::this.handleStartYearByYear;
        this.handleResolve = ::this.handleResolve;
        this.handleEdit = ::this.handleEdit;
        this.handleAddNew = ::this.handleAddNew;
        this.handleConfirm = ::this.handleConfirm;
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

    handleImportUntil(id) {
        this.props.performImportUntil(id)
            .then(action => {
                /*if(!action.response.complete){
                    this.props.next({index: EXPLAINATION});
                }
                else{
                    this.props.end();
                }*/
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
        this.props.destroyForm('amend');
        this.props.show('editTransaction', {...this.props.transactionViewData,
            startId: pendingActions[0].id,
            endId: pendingActions[pendingActions.length-1].previous_id,
            actionSet,
            otherActions,
            afterClose: { showTransactionView: {key: 'importHistoryChunk', data: {...this.props.transactionViewData, index: EXPLAINATION}}}
        });
    }

    handleAddNew(pendingActions) {
        this.props.destroyForm('amend');
        this.props.show('editTransaction', {...this.props.transactionViewData,
            startId: pendingActions[0].id,
            endId: pendingActions[pendingActions.length-1].previous_id,
            otherActions: pendingActions,
            afterClose: { showTransactionView: {key: 'importHistoryChunk', data: {...this.props.transactionViewData, index: EXPLAINATION}}}
        });
    }

    handleResolve() {
        const pendingActions = collectChunkedActions(this.props.pendingHistory.data || []);
        this.props.destroyForm('amend');
        this.props.show('resolveAmbiguity',
            {
                ...this.props.transactionViewData,
                error: this.props.importHistory.error,
                 //open this transactionView again
                afterClose: { showTransactionView: {key: 'importHistoryChunk', data: {...this.props.transactionViewData, index: CONTINUE}}},
                editTransactionData: {
                    startId: pendingActions[0].id,
                    endId: pendingActions[pendingActions.length-1].previous_id,
                    pendingActions,
                    afterClose: { showTransactionView: {key: 'importHistoryChunk', data: {...this.props.transactionViewData, index: EXPLAINATION}}}
                }
        });
    }

    handleConfirm(transaction, previousTransactions, confirmState=true) {

        const pendingAction = {...transaction};
        const id = !previousTransactions.length ? pendingAction.id : null;

        pendingAction.data.actions = pendingAction.data.actions.map((a) => {
            return {userConfirmed: confirmState, ...a}
        });

        this.props.updateAction({
            pendingActions: [pendingAction]
        })
        .then(() => {
            if(id){
                return this.handleImportUntil(id);
            }
        });
    }


    toggleUserConfirmed() {
        debugger
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>{ STRINGS.importCompanyHistory } </TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody() }
              </TransactionView.Body>
            </TransactionView>
    }
}
