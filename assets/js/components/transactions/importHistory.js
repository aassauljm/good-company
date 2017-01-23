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
import Loading from '../loading'
import { reduxForm, destroy } from 'redux-form';


function companiesOfficeDocumentUrl(companyState, documentId){
    const companyNumber = companyState.companyNumber;
    return `http://www.business.govt.nz/companies/app/ui/pages/companies/${companyNumber}/${documentId}/entityFilingRequirement`;
}



const INTRODUCTION = 0;
const LOADING = 1;
const AMBIGUITY = 2;
const FINISHED = 3;
const CONTINUE = 4;

const PAGES = [];

PAGES[INTRODUCTION] = function() {
    if(this.props.pendingHistory._status === 'fetching'){
        return <Loading />
    }

    if(this.props.transactionViewData.companyState.extensive){
        return <div className="alert alert-danger">
        <p>Warning, this company has an extensive shareholdings, meaning full shareholding information is unavailable.  </p>
        <p>We are currently working on tools to enable the creation of a complete share register for an extensive shareholding.</p>
            </div>
    }
    if(this.props.pendingHistory._status === 'complete'){
        return <div><p>To create the share register, Good Companies starts with the documents on the companies register. Those documents contain current and historic details of shares, shareholders, and share transactions.</p>
        <p>There are { this.props.pendingHistory.data.length }  documents to import. If those documents contain all the information required for a share register, Good Companies can create the register automatically. If not, you will be asked to confirm or, if necessary, edit the imported details.</p>
        <div className="alert alert-info text-center no-margin">Before getting started, have all shareholding changes for this company been notified to the companies register?</div>
        </div>
    }
};

PAGES[LOADING] = function() {

    if(this.props.importHistory._status === 'fetching'){
        return <div>
            <p className="text-center">This may take a few moments</p>
                <Loading />
            </div>
    }
    else if(this.props.importHistory._status === 'complete'){
       return <div>
        <p>All Companies Office documents have successfully been imported.</p>
        </div>
    }
};

PAGES[AMBIGUITY] = function(){
    if(this.props.importHistory._status === 'error'){
        const companyName = this.props.transactionViewData.companyState.companyName;
        const context = this.props.importHistory.error.context || {};

        const documentId =  context.actionSet && context.actionSet.data.documentId;
        const documentUrl = documentId && companiesOfficeDocumentUrl(this.props.transactionViewData.companyState, documentId);
       return <div>
        <p className="text-danger">We need your help understand a document from the Companies Office.</p>
        <p className="text-danger">Reason: {this.props.importHistory.error.message || 'Processing Error'}</p>
        { documentId && <p>Source: <Link target="_blank" to={documentUrl}>Companies Office document {documentId}</Link></p> }
        </div>
    }
}



const FOOTERS = [];

FOOTERS[INTRODUCTION] = function(){
    if(this.props.pendingHistory._status === 'complete'){
        return <div>
             <div className="button-row">
                {  <Button onClick={() => this.props.end({cancelled: true})} >Cancel</Button> }
                { !this.props.transactionViewData.companyState.extensive && <Button onClick={this.handleStart} bsStyle="primary">Yes, all changes have been notified</Button> }
                { !this.props.transactionViewData.companyState.extensive && <Button onClick={this.handleStartYearByYear} bsStyle="primary">No, there are changes that have not been notified</Button> }
                </div>
            </div>
    }
}

FOOTERS[LOADING] = function(){
    return false;
}

FOOTERS[AMBIGUITY] = function(){
    return <div className="button-row">
        <Button onClick={this.props.end} >Cancel</Button>
        <Button onClick={this.handleResolve} bsStyle="primary">Resolve</Button>
        </div>
}



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
                                                     {
                                                        requireConfirmation: true
                                                     }, {
                                                        invalidates: [`/company/${ownProps.transactionViewData.companyId}`, '/alerts']
                                                     })),
        addNotification: (args) => dispatch(addNotification(args)),
        destroyForm: (args) => dispatch(destroy(args))
    }
})
export class ImportHistoryTransactionView extends React.Component {

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

    renderFooter(){
        return FOOTERS[this.props.index] && FOOTERS[this.props.index].call(this);
    }

    handleStart() {
        this.props.next({index: LOADING});
        this.props.performImport()
            .catch(e => {
                this.handleResolve();
            });
    }

    handleStartYearByYear() {
        this.props.show('importHistoryChunk', {...this.props.transactionViewData});
    }

    handleResolve() {
        this.props.destroyForm('amend');
        this.props.show('resolveAmbiguity', {...this.props.transactionViewData,
            error: this.props.importHistory.error, afterClose: { // open this transactionView again
                            showTransactionView: {key: 'importHistory', data: {...this.props.transactionViewData, index: CONTINUE}}}});
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Import Company History from Companies Register</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody() }
              </TransactionView.Body>
              <TransactionView.Footer>
                { this.renderFooter() }
              </TransactionView.Footer>
            </TransactionView>
    }
}
