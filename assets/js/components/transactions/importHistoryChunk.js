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


const INTRODUCTION = 0;
const LOADING = 1;
const AMBIGUITY = 2;
const FINISHED = 3;
const CONTINUE = 4;

const PAGES = [];


function TransactionSummaries(props) {
    const pendingActions = [...props.pendingActions];
    pendingActions.reverse();
    return <div>
    <p>Click on any entry to make corrections, then click 'Confirm Transactions' to move onto the next year</p>
    <h5 className="text-center">Summary for the Year beginning on { stringDateToFormattedString(props.pendingActions[props.pendingActions.length-1].data.effectiveDate) }  </h5>
        <hr/>
        { pendingActions.map((p, i) => {
            const actions = p.data.actions.filter(a => a.transactionType);
            if(!actions){
                return false;
            }
            return <div key={i}>
                <div  className="panel panel-default actionable">
                        <div className="panel-body transaction-table">
                        <div className="col-md-2 transaction-terse-date">
                            { stringDateToFormattedString(p.data.effectiveDate) }
                        </div>
                        <div className="col-md-10">
                        { actions.map((action, i) => {
                            const Terse =  TransactionTerseRenderMap[action.transactionType] || TransactionTerseRenderMap.DEFAULT;
                                return  Terse && <Terse {...action} key={i}/>
                            }) }
                    </div>
                </div>
                </div>
            </div>
        })}
    <div className="button-row"><Button bsStyle="primary" onClick={props.performImport}>Confirm Transactions</Button></div>
    </div>
}



PAGES[INTRODUCTION] = function() {
    if(this.props.pendingHistory._status === 'fetching'){
        return <div className="loading"> <Glyphicon glyph="refresh" className="spin"/></div>
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
            return <TransactionSummaries pendingActions={pendingYearActions} performImport={this.handleStart}/>
        }
    }
    return false;
};

PAGES[LOADING] = function() {
    if(this.props.importHistory._status === 'fetching'){
        return <div>
            <p className="text-center">This may take a few moments</p>
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

    }

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
            .then(r => {
                this.props.next({index: INTRODUCTION});
            })
            .catch(e => {
                this.handleResolve();
            })
    }

    handleStartYearByYear() {
        this.props.show('importHistoryChunk', {...this.props.transactionViewData});
    }

    handleResolve() {
        this.props.show('resolveAmbiguity', {...this.props.transactionViewData, error: this.props.importHistory.error, afterClose: { // open this transactionView again
                            showTransactionView: {key: 'importHistoryChunk', data: {...this.props.transactionViewData, index: CONTINUE}}}});
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
