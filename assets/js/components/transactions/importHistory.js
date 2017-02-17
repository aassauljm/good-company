"use strict";
import React, { PropTypes } from 'react';
import { requestResource, createResource, updateResource, addNotification } from '../../actions';
import { pureRender, stringDateToFormattedString, stringDateToFormattedStringTime, generateShareClassMap, getTotalShares } from '../../utils';
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

function collectActions(pendingHistory){
    return pendingHistory;
}


const EXPLAINATION = 0;
const LOADING = 1;
const AMBIGUITY = 2;
const FINISHED = 3;
const CONTINUE = 4;

const PAGES = [];


function TransactionSummaries(props) {
    const pendingActions = props.pendingActions.filter((p, i) => {
        p.numberId = i;
        const actions = p.data.actions.filter(a => a.transactionType);
        if(!actions.length || isNonDisplayedTransaction(p.data.transactionType)){
            return false;
        }
        if(!props.showConfirmed && actions.every(a => a.userConfirmed) && !requiresEdit(p.data)){
            return false;
        }
        return true;
    });
    const className = props.loading ? 'button-loading' : '';
    return <div className={className}>
        <p>Please Confirm or Edit the transactions listed below.  Entries shown in red will require your manual reconciliation.  Please note that even confirmed transactions may require corrections.</p>
        <hr/>
        <Shuffle >
            { pendingActions.map((p, i) => {
                const required = requiresEdit(p.data);
                const showUnconfirm = !required && p.data.actions.every(a => a.userConfirmed);
                const showConfirm = !required && !showUnconfirm;
                const editable = (isEditable(p.data) && !p.data.actions.every(a => a.userConfirmed)) || required;
                let className = "panel panel-default"
                if(required){
                    className = "panel panel-danger"
                }
                return <div key={p.numberId}>
                        <div  className={className}>
                            <div className="panel-heading">
                                <div className="row transaction-table">
                                    <div className="transaction-terse-date col-md-2">
                                        { stringDateToFormattedStringTime(p.data.effectiveDate) }
                                    </div>
                                    <div className="col-md-8">
                                    { p.data.actions.map((action, i) => {
                                        const Terse =  TransactionTerseRenderMap[action.transactionType] || TransactionTerseRenderMap.DEFAULT;
                                        return  action.transactionType && Terse && <Terse {...action} shareClassMap={props.shareClassMap} key={i}/>
                                    }) }
                                    </div>
                                    <div className="col-md-1">{
                                        editable && <div className="button-row"><Button bsStyle="info" onClick={() => props.handleEdit(p, props.pendingActions)}>Edit</Button></div>
                                    }</div>
                                    <div className="col-md-1">
                                        { showConfirm &&  <div className="button-row"><Button bsStyle="success" onClick={() => props.handleConfirm(p) }>Confirm</Button></div> }
                                        { showUnconfirm &&  <div className="button-row"><Button bsStyle="warning" onClick={() => props.handleConfirm(p, false ) }>Unconfirm</Button></div> }
                                    </div>
                                </div>
                            </div>
                            </div>
                        </div>
            }) }
        </Shuffle>
        <div className="button-row">
        <Button onClick={() => props.end({cancelled: true})}>Cancel</Button>
        { props.showConfirmed && <Button bsStyle="info"  onClick={props.toggleConfirmed }>Hide Confirmed</Button> }
        { !props.showConfirmed &&<Button bsStyle="info"  onClick={props.toggleConfirmed}>Show Confirmed</Button> }

        { !!pendingActions.length && <Button bsStyle="primary" className="submit-import" onClick={props.handleStart}>Confirm All Transactions and Import</Button> }
        { !pendingActions.length && <Button bsStyle="primary" className="submit-import" onClick={props.handleStart}>Complete Reconciliation</Button> }
        {  <Button bsStyle="danger" onClick={props.handleReset}>Undo Company Reconciliation</Button> }

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

    return actions.some(a => requiredTypes[a.transactionType]) || getTotalShares(data) !== 0;
}


function isEditable(data){
    const actions = data.actions;
    /*if({[TransactionTypes.INCORPORATION]: true}[data.transactionType]){
        return false;
    }*/

    const editableTypes = {
        [TransactionTypes.ISSUE]: true,
        [TransactionTypes.CONVERSION]: true,
        [TransactionTypes.REDEMPTION]: true,
        [TransactionTypes.PURCHASE]: true,
        [TransactionTypes.ACQUISITION]: true,
        [TransactionTypes.CANCELLATION]: true,
        [TransactionTypes.CONSOLIDATION]: true,
        [TransactionTypes.CONVERSION]: true,
        [TransactionTypes.SUBDIVISION]: true,
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
    if(this.state.pendingHistory._status === 'fetching'){
        return  <Loading />
    }

    if(this.props.transactionViewData.companyState.extensive){
        return <div className="alert alert-danger">
        <p>Warning, this company has an extensive shareholdings, meaning full shareholding information is unavailable.  </p>
        <p>We are currently working on tools to enable the creation of a complete share register for an extensive shareholding.</p>
            </div>
    }
    if(this.state.pendingHistory._status === 'complete'){
        const pendingYearActions = collectActions(this.state.pendingHistory.data);
        if(pendingYearActions.length){
            return <TransactionSummaries
                shareClassMap={generateShareClassMap(this.props.transactionViewData.companyState) }
                pendingActions={pendingYearActions}
                handleStart={this.handleStart}
                handleAddNew={this.handleAddNew}
                handleEdit={this.handleEdit}
                handleReset={this.handleReset}
                end={this.props.end}
                handleConfirm={this.handleConfirm}
                toggleConfirmed={this.toggleConfirmed}
                loading={this.isLoading()}
                showConfirmed={this.props.transactionViewData.showConfirmed}
                />
        }
        else{
           return <div>
                <p>All transactions notified to the companies register have been reconciled.</p>
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
        importHistoryUntil: state.resources[`/company/${ownProps.transactionViewData.companyId}/import_pending_history_until`] || {},
        updatePendingHistory: state.resources[`/company/${ownProps.transactionViewData.companyId}/update_pending_history`] || {},
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
                                                     {target: id}, {
                                                        invalidates: [`/company/${ownProps.transactionViewData.companyId}`, '/alerts']
                                                     })),
        addNotification: (args) => dispatch(addNotification(args)),
        destroyForm: (args) => dispatch(destroy(args)),
        reset: (args) => {
            return dispatch(updateResource(`/company/${ownProps.transactionViewData.companyId}/reset_pending_history`, {}, {loadingMessage: 'Undoing Company Reconciliation'}))
            .then(() => {
                dispatch(addNotification({message: 'Company Reconciliation Reset'}));
            })
        },
        updateAction: (args) => {
            return dispatch(updateResource(`/company/${ownProps.transactionViewData.companyId}/update_pending_history`, args, {
                invalidates: [`/company/${ownProps.transactionViewData.companyId}/pending_history`]
            }))
            .then((r) => {
                dispatch(destroy('amend'));
                //ownProps.end();
                return r;
            })
        },
    }
})
export class ImportHistoryTransactionView extends React.Component {

    constructor(props){
        super(props);
        this.handleStart = ::this.handleStart;
        this.handleResolve = ::this.handleResolve;
        this.handleEdit = ::this.handleEdit;
        this.handleAddNew = ::this.handleAddNew;
        this.handleConfirm = ::this.handleConfirm;
        this.toggleConfirmed = ::this.toggleConfirmed;
        this.handleReset = ::this.handleReset;
        this.state = {pendingHistory: props.pendingHistory};
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

    componentWillReceiveProps(newProps) {
        if(newProps.pendingHistory && newProps.pendingHistory.data){
            this.setState({pendingHistory: newProps.pendingHistory})
        }
    }

    checkContinue() {
        if(this.props.index === CONTINUE){
            this.handleStart();
        }
    }

    renderBody() {
        return  PAGES[this.props.index] && PAGES[this.props.index].call(this);
    }

    isLoading() {
        return this.props.pendingHistory._status !== 'complete' || this.props.updatePendingHistory._status === 'fetching'
    }

    handleStart() {
        this.props.next({index: LOADING});
        this.props.performImport()
            .then(action => {
                this.props.end();
            })
            .catch(e => {
                this.handleResolve(this.props.importHistory.error, CONTINUE);
            })
    }

    handleReset() {
        this.props.reset();
    }

    handleEdit(actionSet, pendingActions) {
        this.props.destroyForm('amend');
        this.props.show('editTransaction', {...this.props.transactionViewData,
            startId: pendingActions[0].id,
            endId: pendingActions[pendingActions.length-1].previous_id,
            actionSet,
            pendingActions,
            afterClose: { showTransactionView: {key: 'importHistory', data: {...this.props.transactionViewData, index: EXPLAINATION}}}
        });
    }

    handleAddNew(pendingActions) {
        this.props.destroyForm('amend');
        this.props.show('editTransaction', {...this.props.transactionViewData,
            startId: pendingActions[0].id,
            endId: pendingActions[pendingActions.length-1].previous_id,
            otherActions: pendingActions,
            afterClose: { showTransactionView: {key: 'importHistory', data: {...this.props.transactionViewData, index: EXPLAINATION}}}
        });
    }

    handleResolve(error, afterIndex) {
        const pendingActions = collectActions(this.state.pendingHistory.data || []);
        this.props.destroyForm('amend');
        this.props.show('resolveAmbiguity',
            {
                ...this.props.transactionViewData,
                error: error,
                 //open this transactionView again
                afterClose: { showTransactionView: {key: 'importHistory', data: {...this.props.transactionViewData, index: afterIndex}}},
                editTransactionData: {
                    startId: pendingActions[0].id,
                    endId: pendingActions[pendingActions.length-1].previous_id,
                    pendingActions,
                    // other actions
                    afterClose: { showTransactionView: {key: 'importHistory', data: {...this.props.transactionViewData, index: EXPLAINATION}}}
                }
        });
    }

    handleConfirm(transaction, confirmState=true) {
        if(this.isLoading()){
            return false;
        }
        const pendingAction = {...transaction};
        const pendingActions = collectActions(this.state.pendingHistory.data || []);
        const index = pendingActions.findIndex(p => p.id === transaction.id);
        pendingAction.data.actions = pendingAction.data.actions.map((a) => {
            return {...a, userConfirmed: confirmState}
        });
        this.props.updateAction({
            pendingActions: [...(pendingActions.slice(0, index)), pendingAction]
        })
    }


    toggleConfirmed() {
        this.props.show('importHistory',
                        { ...this.props.transactionViewData,
                        showConfirmed: !this.props.transactionViewData.showConfirmed});
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
