"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import { requestResource, createResource, updateResource, addNotification } from '../../actions';
import { pureRender, stringDateToFormattedString, stringDateToFormattedStringTime, generateShareClassMap, getTotalShares } from '../../utils';
import { ScrollIntoViewOptional } from '../../hoc/scrollIntoView';
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


@ScrollIntoViewOptional
class PendingFutureAction extends React.PureComponent {
    render() {
        const props = this.props;
        const p = this.props.action;
        const required = requiresEdit(p.data);
        const showUnconfirm = !required && p.data.actions.every(a => a.userConfirmed) && !p.data.historic;
        const showConfirm = !showUnconfirm && !p.data.historic;;
        const editable = (isEditable(p.data) && !p.data.actions.every(a => a.userConfirmed)) || required;
        const showSkip = !p.data.actions.every(a => a.userSkip)
        let className = "panel panel-default"
        if(required){
            className = "panel panel-danger"
        }

        return  <div  className={className}>
                   <div className="panel-heading">
                   <div className="row">
                        <div className="col-md-9">
                            <div className="transaction-terse-date ">
                                { stringDateToFormattedStringTime(p.data.effectiveDate) }
                            </div>
                            { p.data.actions.map((action, i) => {
                                const Terse =  TransactionTerseRenderMap[action.transactionType] || TransactionTerseRenderMap.DEFAULT;
                                return  action.transactionType && Terse && <Terse {...action} shareClassMap={props.shareClassMap} key={i}/>
                            }) }
                        </div>

                        <div className="col-md-3 col-xs-12 text-right">
                        <div className="btn-group">
                            <Button bsStyle="info" disabled={!editable} onClick={() => props.handleEdit(p, props.pendingActions, props.index)}>Edit</Button>

                            { !showSkip &&  <Button bsStyle="warning" onClick={() => props.handleSkip(p, false)}>Unskip All</Button> }
                            { showSkip &&  <Button bsStyle="primary" onClick={() => props.handleSkip(p)}>Skip All</Button> }

                            { showConfirm &&  <Button bsStyle="success" disabled={required} onClick={() => props.handleConfirm(p) }>Confirm</Button> }
                            { showUnconfirm &&  <Button bsStyle="danger" onClick={() => props.handleConfirm(p, false ) }>Unconfirm</Button> }
                          </div>
                          </div>
                    </div>
                    </div>


            </div>
    }
}

const PendingFutureActions = (props) => {
    return <Shuffle>
            { props.pendingActions.map((p, i) => <div key={p.numberId} ><PendingFutureAction  {...props} action={p} index={i}  scrollIntoView={i === props.scrollIndex}/></div>) }
        </Shuffle>
}


@ScrollIntoViewOptional
class PendingAction extends React.PureComponent {

    constructor(props){
        super(props);
        this.edit = ::this.edit;
        this.confirm = ::this.confirm;
        this.unconfirm = ::this.unconfirm;
    }

    edit(){
        this.props.handleEdit(this.props.action, this.props.pendingActions, this.props.index)
    }

    confirm(){
        this.props.handleConfirm(this.props.action)
    }

    unconfirm(){
        this.props.handleConfirm(this.props.action, false)
    }

    render() {
        const props = this.props;
        const p = this.props.action;
        const required = requiresEdit(p.data);
        const showUnconfirm = !required && p.data.actions.every(a => a.userConfirmed) && !p.data.historic;
        const showConfirm = !required && !showUnconfirm && !p.data.historic;;
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
                            { p.data.historic && <strong>Historic Transaction</strong> }
                            { p.data.actions.map((action, i) => {
                                const Terse =  TransactionTerseRenderMap[action.transactionType] || TransactionTerseRenderMap.DEFAULT;
                                return  action.transactionType && Terse && <Terse {...action} shareClassMap={props.shareClassMap} key={i}/>
                            }) }
                            </div>
                            <div className="col-md-1">{
                                editable && <div className="button-row"><Button bsStyle="info" onClick={this.edit}>Edit</Button></div>
                            }</div>
                            <div className="col-md-1">
                                { showConfirm &&  <div className="button-row"><Button bsStyle="success" onClick={this.confirm }>Confirm</Button></div> }
                                { showUnconfirm &&  <div className="button-row"><Button bsStyle="warning" onClick={this.unconfirm }>Unconfirm</Button></div> }
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
    }
}
class TransactionSummariesList extends React.PureComponent {
    render() {
        const props = this.props;
        const pendingActions = props.pendingActions;
        return <Shuffle>
                { pendingActions.map((p, i) => <div key={p.numberId}><PendingAction
                                     handleEdit={props.handleEdit}
                                     handleConfirm={props.handleConfirm}
                                     pendingActions={pendingActions}
                                     action={p}
                                     index={i}
                                     scrollIntoView={i === props.scrollIndex}
                                     shareClassMap={props.shareClassMap}/></div>) }
                </Shuffle>
    }
}
class TransactionSummaries extends React.PureComponent {
    constructor(props){
        super(props);
        this.cancel = ::this.cancel;
        this.state = {pendingActions: this.filterActions(props)};
    }

    componentWillReceiveProps(newProps){
        this.setState({pendingActions: this.filterActions(newProps)});
    }

    cancel() {
        this.props.end({cancelled: true})
    }

    filterActions(props) {
        let incorpIndex = props.pendingActions.findIndex(p => p.data.transactionType === TransactionTypes.INCORPORATION);
        return props.pendingActions.filter((p, i) => {
            p.numberId = i;
            const actions = p.data.actions.filter(a => a.transactionType);
            if(!actions.length || (!props.showAllTypes && isNonDisplayedTransaction(p.data.transactionType))){
                return false;
            }
            if(!props.showConfirmed && actions.every(a => a.userConfirmed) && !requiresEdit(p.data)){
                return false;
            }
            if(i > incorpIndex && incorpIndex >= 0){
                return false;
            }
            return true;
        });

    }

    render() {
        const props = this.props;
        const pendingActions = this.state.pendingActions;
        const className = props.loading ? 'button-loading' : 'loaded';
        let message = pendingActions.length ?
            'Please Confirm or Edit the transactions from the last 10 years listed below.  Entries shown in red will require your manual reconciliation.  Please note that even confirmed transactions may require corrections.' :
            "All transactions are confirmed.  Please click 'Complete Reconciliation' to complete the import."


        return <div className={className}>
            <p>{ message }</p>
            <hr/>
            <TransactionSummariesList pendingActions={pendingActions} handleEdit={props.handleEdit} handleConfirm={props.handleConfirm} scrollIntoView={props.scrollIntoView} shareClassMap={props.shareClassMap} />
            <div className="button-row">
                <Button onClick={this.cancel}>Cancel</Button>
                { props.showConfirmed && <Button bsStyle="info"  onClick={props.toggleConfirmed }>Hide Confirmed</Button> }
                { !props.showConfirmed &&<Button bsStyle="info"  onClick={props.toggleConfirmed}>Show Confirmed</Button> }
                { !!pendingActions.length && <Button bsStyle="primary" className="submit-import" onClick={props.handleStart}>Confirm All Transactions and Import</Button> }
                { !pendingActions.length && <Button bsStyle="primary" className="submit-import" onClick={props.handleStart}>Complete Reconciliation</Button> }
               <Button bsStyle="danger" onClick={props.handleReset}>Undo Company Reconciliation</Button>

             { /* false && <Button bsStyle="info" onClick={() => props.handleAddNew(pendingActions)}>Add New Transaction</Button> */ }
            </div>
        </div>
    }
}


function FutureTransactionSummaries(props) {
    let incorpIndex = props.pendingActions.findIndex(p => p.data.transactionType === TransactionTypes.INCORPORATION);
    const pendingActions = props.pendingActions.filter((p, i) => {
        const actions = p.data.actions.filter(a => a.transactionType);
        p.numberId = i;
        if(!props.showConfirmed && actions.every(a => a.userConfirmed) && !requiresEdit(p.data)){
            return false;
        }
        return true;
    });
    const className = props.loading ? 'button-loading' : 'loaded';
    let message = pendingActions.length ?
        'Please Confirm or Edit the recent transactions listed below.  Please note that even confirmed transactions may require corrections.' :
        "All transactions are confirmed.  Please click 'Complete Reconciliation' to complete the import.";

    return <div className={className}>
        <p>{ message }</p>
        <hr/>
        <PendingFutureActions scrollIndex={props.scrollIndex} pendingActions={pendingActions} handleEdit={props.handleEdit} handleConfirm={props.handleConfirm} handleSkip={props.handleSkip} />
        <div className="button-row">
        <Button onClick={() => props.end({cancelled: true})}>Cancel</Button>
        { props.showConfirmed && <Button bsStyle="info"  onClick={props.toggleConfirmed }>Hide Confirmed</Button> }
        { !props.showConfirmed &&<Button bsStyle="info"  onClick={props.toggleConfirmed}>Show Confirmed</Button> }
        { !!pendingActions.length && <Button bsStyle="primary" className="submit-import" onClick={props.handleStart}>Confirm All Transactions and Import</Button> }
        { !pendingActions.length && <Button bsStyle="primary" className="submit-import" onClick={props.handleStart}>Complete Reconciliation</Button> }
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
    if(actions.every(a => a.userSkip)){
        return false;
    }
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
        [TransactionTypes.NEW_DIRECTOR]: true,
        [TransactionTypes.REMOVE_DIRECTOR]: true
    };
    return actions.some(a => editableTypes[a.transactionType]);
}

function isNonDisplayedTransaction(transactionType){
    return {
        [TransactionTypes.ANNUAL_RETURN]: true
    }[transactionType];
}

const HISTORY_PAGES = [];
HISTORY_PAGES[EXPLAINATION] = function() {
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
                shareClassMap={this.state.shareClassMap}
                pendingActions={pendingYearActions}
                handleStart={this.handleStart}
                handleAddNew={this.handleAddNew}
                handleEdit={this.handleEdit}
                handleReset={this.handleReset}
                end={this.props.end}
                handleConfirm={this.handleConfirm}
                toggleConfirmed={this.toggleConfirmed}
                loading={this.isLoading()}
                scrollIndex={this.props.transactionViewData.editIndex}
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

HISTORY_PAGES[LOADING] = function() {
    if(this.props.importHistory._status === 'fetching'){
        return <div>
            <p className="text-center">Importing Transactions - This may take a few moments</p>
                <Loading />
        </div>
    }
    else if(this.props.importHistory._status === 'complete'){
       return <div>
        <p>All Companies Office documents have successfully been imported.</p>
        </div>
    }

};


const FUTURE_PAGES = [];
FUTURE_PAGES[EXPLAINATION] = function() {
    if(this.state.pendingFuture._status === 'fetching'){
        return  <Loading />
    }
    if(this.state.pendingFuture._status === 'complete'){
        const pendingActions = collectActions(this.state.pendingFuture.data);
        if(pendingActions.length){
            return <FutureTransactionSummaries
                shareClassMap={generateShareClassMap(this.props.transactionViewData.companyState) }
                companyState={this.props.transactionViewData.companyState}
                pendingActions={pendingActions}
                handleStart={this.handleStart}
                handleAddNew={this.handleAddNew}
                handleEdit={this.handleEdit}
                handleReset={this.handleReset}
                end={this.props.end}
                handleConfirm={this.handleConfirm}
                handleSkip={this.handleSkip}
                toggleConfirmed={this.toggleConfirmed}
                loading={this.isLoading()}
                scrollIndex={this.props.transactionViewData.editIndex}
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

FUTURE_PAGES[LOADING] = function() {
    if(this.props.importFuture._status === 'fetching'){
        return <div>
            <p className="text-center">Importing Transactions - This may take a few moments</p>
                <Loading />
        </div>
    }
    else if(this.props.importFuture._status === 'complete'){
       return <div>
        <p>All Companies Office documents have successfully been imported.</p>
        </div>
    }
}

FUTURE_PAGES[FINISHED] = function() {
    return <div>
        <p>All Companies Office change has been successfully reconciled.</p>
        <div className="button-row">
        <Link className="btn btn-primary" to={`/company/view/${this.props.transactionViewData.companyId}`}>Click here to return to your company page</Link>
        </div>
        </div>
}

@connect((state, ownProps) => {
    return {
        pendingHistory: state.resources[`/company/${ownProps.transactionViewData.companyId}/pending_history`] || {},
        importHistory: state.resources[`/company/${ownProps.transactionViewData.companyId}/import_pending_history`] || {},
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
export class ImportHistoryTransactionView extends React.PureComponent {

    constructor(props){
        super(props);
        this.handleStart = ::this.handleStart;
        this.handleResolve = ::this.handleResolve;
        this.handleEdit = ::this.handleEdit;
        this.handleAddNew = ::this.handleAddNew;
        this.handleConfirm = ::this.handleConfirm;
        this.toggleConfirmed = ::this.toggleConfirmed;
        this.handleReset = ::this.handleReset;
        this.state = {pendingHistory: props.pendingHistory, shareClassMap: generateShareClassMap(props.companyState)};
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
        this.setState({shareClassMap: generateShareClassMap(this.props.companyState)});
    }

    checkContinue() {
        if(this.props.index === CONTINUE && !this.isLoading()){
            this.handleStart();
        }
    }

    renderBody() {
        return  HISTORY_PAGES[this.props.index] && HISTORY_PAGES[this.props.index].call(this);
    }

    isLoading() {
        return this.props.pendingHistory._status !== 'complete' || this.props.updatePendingHistory._status === 'fetching'
    }

    handleStart() {
        this.props.next({index: LOADING});
        this.props.performImport()
            .then(action => {
                return this.props.end();
            })
            .catch(e => {
                return this.handleResolve(this.props.importHistory.error);
            })
    }

    handleReset() {
        this.props.reset();
    }

    handleEdit(actionSet, pendingActions, editIndex) {
        pendingActions = collectActions(this.state.pendingHistory.data || []);
        this.props.destroyForm('amend');
        this.props.show('editTransaction', {...this.props.transactionViewData,
            startId: pendingActions[0].id,
            endId: pendingActions[pendingActions.length-1].previous_id,
            actionSet,
            pendingActions,
            afterClose: { showTransactionView: {key: 'importHistory', data: {...this.props.transactionViewData, index: EXPLAINATION, editIndex}}}
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

    handleResolve(error) {
        let pendingActions = collectActions(this.state.pendingHistory.data || []);
        const id = error.context.actionSet.id;
        const index = pendingActions.findIndex((a) => a.id === id)
        pendingActions = pendingActions.slice(index);

        this.props.destroyForm('amend');
        this.props.show('resolveAmbiguity',
            {
                ...this.props.transactionViewData,
                error: error,
                 //open this transactionView again
                afterClose: { showTransactionView: {key: 'importHistory', data: {...this.props.transactionViewData, index: CONTINUE}}},
                editTransactionData: {
                    startId: pendingActions[0].id,
                    endId: pendingActions[pendingActions.length-1].previous_id,
                    pendingActions,
                    // other actions
                    afterClose: { showTransactionView: {key: 'importHistory', data: {...this.props.transactionViewData, index: CONTINUE}}}
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
        });
    }


    toggleConfirmed() {
        this.props.show('importHistory',
                        { ...this.props.transactionViewData,
                        showConfirmed: !this.props.transactionViewData.showConfirmed});
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>{ STRINGS.importCompanyHistory } </TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody() }
              </TransactionView.Body>
            </TransactionView>
    }
}


@connect((state, ownProps) => {
    return {
        pendingFuture: state.resources[`/company/${ownProps.transactionViewData.companyId}/pending_future`] || {},
        importFuture: state.resources[`/company/${ownProps.transactionViewData.companyId}/import_pending_future`] || {},
        updatePendingFuture: state.resources[`/company/${ownProps.transactionViewData.companyId}/update_pending_future`] || {},
        companyState: state.resources[`/company/${ownProps.transactionViewData.companyId}`] || {},
    };
}, (dispatch, ownProps) => {
    return {
        requestData: () => dispatch(requestResource(`/company/${ownProps.transactionViewData.companyId}/pending_future`)),
        performImport: () => dispatch(createResource(`/company/${ownProps.transactionViewData.companyId}/import_pending_future`,
                                                     {}, {
                                                        invalidates: [`/company/${ownProps.transactionViewData.companyId}`, '/alerts']
                                                     })),
        addNotification: (args) => dispatch(addNotification(args)),
        destroyForm: (args) => dispatch(destroy(args)),
        updateAction: (args) => {
            return dispatch(updateResource(`/company/${ownProps.transactionViewData.companyId}/update_pending_future`, args, {
                invalidates: [`/company/${ownProps.transactionViewData.companyId}/pending_future`]
            }))
            .then((r) => {
                dispatch(destroy('amend'));
                //ownProps.end();
                return r;
            })
        },
    }
})
export class ImportFutureTransactionView extends React.Component {

    constructor(props){
        super(props);
        this.handleStart = ::this.handleStart;
        this.handleResolve = ::this.handleResolve;
        this.handleEdit = ::this.handleEdit;
        this.handleConfirm = ::this.handleConfirm;
        this.handleSkip= ::this.handleSkip;
        this.toggleConfirmed = ::this.toggleConfirmed;
        this.state = {pendingFuture: props.pendingFuture};
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
        if(newProps.pendingFuture && newProps.pendingFuture.data){
            this.setState({pendingFuture: newProps.pendingFuture})
        }
    }

    checkContinue() {
        if(this.props.index === CONTINUE){
            this.handleStart();
        }
    }

    renderBody() {
        return  FUTURE_PAGES[this.props.index] && FUTURE_PAGES[this.props.index].call(this);
    }

    isLoading() {
        return this.props.pendingFuture._status !== 'complete' || this.props.updatePendingFuture._status === 'fetching'
    }

    handleStart() {
        this.props.next({index: LOADING});
        this.props.performImport()
            .then(action => {
                this.props.next({index: FINISHED});
            })
            .catch(e => {
                this.handleResolve(this.props.importFuture.error, CONTINUE);
            })
    }


    handleEdit(actionSet, pendingActions, editIndex) {
        this.props.destroyForm('amend');
        this.props.show('editTransaction', {...this.props.transactionViewData,
            startId: pendingActions[0].id,
            endId: pendingActions[pendingActions.length-1].previous_id,
            actionSet,
            pendingActions,
            isFuture: true,
            afterClose: { showTransactionView: {key: 'importFuture', data: {...this.props.transactionViewData, index: EXPLAINATION, editIndex}}}
        });
    }

    handleResolve(error, afterIndex) {
        const pendingActions = collectActions(this.state.pendingFuture.data || []);
        this.props.destroyForm('amend');
        this.props.show('resolveAmbiguity',
            {
                ...this.props.transactionViewData,
                isFuture: true,
                error: error,
                 //open this transactionView again
                afterClose: { showTransactionView: {key: 'importFuture', data: {...this.props.transactionViewData, index: EXPLAINATION}}},
                editTransactionData: {
                    startId: pendingActions[0].id,
                    isFuture: true,
                    endId: pendingActions[pendingActions.length-1].previous_id,
                    pendingActions,
                    // other actions
                    afterClose: { showTransactionView: {key: 'importFuture', data: {...this.props.transactionViewData, index: EXPLAINATION}}}
                }
        });
    }

    handleSkip(transaction, skipState=true) {
        if(this.isLoading()){
            return false;
        }
        const pendingAction = {...transaction};
        const pendingActions = collectActions(this.state.pendingFuture.data || []);
        const index = pendingActions.findIndex(p => p.id === transaction.id);
        pendingAction.data.actions = pendingAction.data.actions.map((a) => {
            return {...a, userConfirmed: true, userSkip: skipState}
        });

        this.props.updateAction({
            pendingActions: [...(pendingActions.slice(0, index)), pendingAction]
        });
    }

    handleConfirm(transaction, confirmState=true) {
        if(this.isLoading()){
            return false;
        }
        const pendingAction = {...transaction};
        const pendingActions = collectActions(this.state.pendingFuture.data || []);
        const index = pendingActions.findIndex(p => p.id === transaction.id);
        pendingAction.data.actions = pendingAction.data.actions.map((a) => {
            return {...a, userConfirmed: confirmState}
        });
        this.props.updateAction({
            pendingActions: [...(pendingActions.slice(0, index)), pendingAction]
        });
    }


    toggleConfirmed() {
        this.props.show('importFuture',
                        { ...this.props.transactionViewData,
                        showConfirmed: !this.props.transactionViewData.showConfirmed});
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>{ STRINGS.importCompanyFuture } </TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody() }
              </TransactionView.Body>
            </TransactionView>
    }
}
