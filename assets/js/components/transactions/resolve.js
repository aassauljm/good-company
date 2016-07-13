"use strict";
import React, { PropTypes } from 'react';
import { requestResource, updateResource, showModal, addNotification } from '../../actions';
import { pureRender, stringToDate, stringToDateTime, renderShareClass, generateShareClassMap, formFieldProps,requireFields } from '../../utils';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Input from 'react-bootstrap/lib/Input';
import { Link } from 'react-router'
import STRINGS from '../../strings'
import { asyncConnect } from 'redux-connect';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { push } from 'react-router-redux'
import Modal from '../forms/modal';
import { enums as ImportErrorTypes } from '../../../../config/enums/importErrors';
import { enums as TransactionTypes } from '../../../../config/enums/transactions';
import { Holding } from '../shareholdings';
import { reduxForm } from 'redux-form';


function companiesOfficeDocumentUrl(companyState, documentId){
    const companyNumber = companyState.companyNumber;
    return `http://www.business.govt.nz/companies/app/ui/pages/companies/${companyNumber}/${documentId}/entityFilingRequirement`;
}


function sourceInfo(companyState, actionSet){
    return <div className="summary outline no-border">
        <div className="outline-header">
            <div className="outline-title">Source Information</div>
        </div>
            <div className="row">
            <div className="col-md-6 summary-label">Registration Date & Time</div>
            <div className="col-md-6">{stringToDateTime(actionSet.data.date)}</div>
        </div>
            <div className="row">
            <div className="col-md-6 summary-label">Source Document</div>
            <div className="col-md-6"><Link target="_blank" to={companiesOfficeDocumentUrl(companyState, actionSet.data.documentId)}>Companies Office</Link></div>
            </div>
    </div>

}


function increaseOptions(){
    return [
        <option key={1} value={TransactionTypes.ISSUE_TO}>{STRINGS.transactionTypes[TransactionTypes.ISSUE_TO]}</option>,
         <option key={0} value={TransactionTypes.TRANSFER_TO}>{STRINGS.transactionTypes[TransactionTypes.TRANSFER_TO]}</option>,
        <option key={2} value={TransactionTypes.SUBDIVISION_TO}>{STRINGS.transactionTypes[TransactionTypes.SUBDIVISION_TO]}</option>,
        <option key={3} value={TransactionTypes.CONVERSION_TO}>{STRINGS.transactionTypes[TransactionTypes.CONVERSION_TO]}</option>
    ];
};

function decreaseOptions(){
    return [
        <option key={1} value={TransactionTypes.PURCHASE_FROM}>{STRINGS.transactionTypes[TransactionTypes.PURCHASE_FROM]}</option>,
        <option key={0} value={TransactionTypes.TRANSFER_FROM}>{STRINGS.transactionTypes[TransactionTypes.TRANSFER_FROM]}</option>,
        <option key={2} value={TransactionTypes.REDEMPTION_FROM}>{STRINGS.transactionTypes[TransactionTypes.REDEMPTION_FROM]}</option>,
        <option key={3} value={TransactionTypes.ACQUISITION_FROM}>{STRINGS.transactionTypes[TransactionTypes.ACQUISITION_FROM]}</option>,
        <option key={4} value={TransactionTypes.CONSOLIDATION_FROM}>{STRINGS.transactionTypes[TransactionTypes.CONSOLIDATION_FROM]}</option>
    ];
};


function findHolding(companyState, action, existing){
    // same names, forget addresses for nwo
    function personsMatch(h1, h2){
        const h2Names = h2.map(h => h.name.toLowerCase());
        return h1.every(p => h2Names.indexOf(p.name.toLowerCase()) >= 0)
    }

    function parcelsMatch(p1, p2){
        // forget shareClass for now
        const sum1 = p1.reduce((sum, p) => sum+p.amount, 0);
        const sum2 = p2.reduce((sum, p) => sum+p.amount, 0);
        return sum1 === sum2;
    }

    return companyState.holdingList.holdings.filter(h => {
        return personsMatch(action.afterHolders || action.holders, h.holders) &&
                parcelsMatch([{amount: action.afterAmount || action.amount, shareClass: action.shareClass}], h.parcels) &&
                existing.indexOf(h) < 0
    })[0];
}

const amendFields = [
    'actions[].type',
    'actions[].otherHoldings[]'
];


function renderHolders(h, i){
    return <div key={i}>
        <div className="name">{ h.name }{h.companyNumber && ` (${h.companyNumber})`}</div>
        <div className="address">{ h.address }</div>
    </div>
}

function isTransfer(type){
    return [TransactionTypes.TRANSFER_FROM, TransactionTypes.TRANSFER_TO].indexOf(type) >= 0;
}

@formFieldProps()
class AmendOptions extends React.Component {
    renderTransfer(action, actions) {
        const holders = actions.map(a => {
            return a.afterHolders || a.holders;
        })
        return <div className="row">

        </div>
    }
    render() {
        const { shareClassMap, fields: {actions}, amendActions } = this.props;
        return <div>
            { actions.map((field, i) => {
                const action = amendActions[i];
                const increase = action.afterAmount > action.beforeAmount || !action.beforeHolders;
                const beforeShares = action.beforeHolders ? `${action.beforeAmount} ${renderShareClass(action.shareClass, shareClassMap)} Shares` : 'No Shares';
                const afterShares = `${action.beforeHolders ? action.afterAmount : action.amount} ${renderShareClass(action.shareClass, shareClassMap)} Shares`;

                return <div  key={i}>
                    <div className="row separated-row">
                    <div className="col-md-5">
                        <div className="shareholding action-description">
                         <div className="shares">{  beforeShares }</div>
                            { (action.beforeHolders || action.holders).map(renderHolders) }
                        </div>
                    </div>
                    <div className="col-md-2">
                        <div className="text-center">
                            <Glyphicon glyph="arrow-right" className="big-arrow"/>
                            <p><span className="shares">{ action.amount } { renderShareClass(action.shareClass, shareClassMap)} Shares { increase ? 'added' : 'removed'} via a:</span></p>
                        </div>
                                <Input type="select" {...this.formFieldProps(['actions', i, 'type'])} label={false}>
                                <option value=""  disabled></option>
                                { increase ? increaseOptions() : decreaseOptions() }
                                </Input>

                    </div>
                    <div className="col-md-5">
                         <div className="shareholding action-description">
                         <div className="shares">{ afterShares }</div>
                        { (action.afterHolders || action.holders).map(renderHolders) }
                        </div>
                    </div>
                </div>
                { isTransfer(field.type.value)  && this.renderTransfer(action, amendActions)}
                <hr/>
                </div>
            }) }
        </div>
    }
}


const validateAmend = (values, props) => {
    const errors = {};
    errors.actions = values.actions.map(action => {
        const errors = {};
        if(!action.type){
            errors.type = ['Required']
        }
        if(isTransfer(action.type)){
            // do sums
        }

        return errors;
    })
    return errors;
}

const AmendOptionsConnected = reduxForm({
    fields: amendFields,
    form: 'amendAction',
    validate: validateAmend
})(AmendOptions);



const DESCRIPTIONS = {
    [TransactionTypes.HOLDING_CHANGE]: function(context, companyState){
        const { action, actionSet } = context;
        return <div>
                <div className="row">
                    <div className="col-md-6 col-md-offset-3">
                        { sourceInfo(companyState, actionSet) }
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-12">
                        <div className="text-center">
                        <h5>{ STRINGS.transactionTypes[action.transactionType] }</h5>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-5">
                        <div className="shareholding action-description ">
                        { action.beforeHolders.map(renderHolders) }
                        </div>
                    </div>
                    <div className="col-md-2">
                        <div className="text-center">
                            <Glyphicon glyph="arrow-right" className="big-arrow"/>
                        </div>
                    </div>
                    <div className="col-md-5">
                        <div className="shareholding action-description ">
                        { action.afterHolders.map(renderHolders) }
                        </div>
                    </div>
                </div>
        </div>
    },
    [TransactionTypes.ANNUAL_RETURN]: function(context, companyState){
        return <div>
            <p className="text-danger">An Annual Return's listings did not match our own.</p>
        </div>
    },
    [TransactionTypes.AMEND]: function(context, companyState){
        const { action, actionSet } = context;
        return <div>
                <div className="row">
                    <div className="col-md-6 col-md-offset-3">
                        { sourceInfo(companyState, actionSet) }
                    </div>
                </div>
            </div>
    },

}

const PAGES = {
    [ImportErrorTypes.MULTIPLE_HOLDINGS_FOUND]: function(context,  submit){
        const { possibleMatches, companyState } = context;
        function handleSelect(holding){
            const updatedActions = {...context.actionSet.data};
            updatedActions.actions = updatedActions.actions.map(a => {
                a = {...a};
                if(a.id === context.action.id){
                    a.holdingId = holding.holdingId;
                }
                return a;
            })
            submit({
                pendingActions: [{id: context.actionSet.id, data: updatedActions, previous_id: context.actionSet.previous_id}]
            })
        }
        return <div>
             <div className="row">
                <div className="col-md-12">
                <p className="instructions">Which shareholding does the result of the transaction refer to?</p>
                </div>
             </div>
             <div className="row">
             { possibleMatches.map((m, i) => <div key={i} className="col-md-6"><Holding holding={m} total={companyState.totalShares} select={handleSelect}/></div>) }
             </div>
        </div>
    },
    [ImportErrorTypes.ANNUAL_RETURN_HOLDING_DIFFERENCE]: function(context, submit, reset){
        function skip(){
            return submit({
                pendingActions: [{id: context.actionSet.id, data: {...context.actionSet.data, userSkip: true, previous_id: context.actionSet.previous_id}}]
            })
        }
        function startOver(){
            return reset();
        }
        return <div className="button-row">
            <Button onClick={skip} className="btn-primary">Skip Annual Return Validation</Button>
            <Button onClick={startOver} className="btn-danger">Restart Import</Button>
        </div>
    },
    [ImportErrorTypes.ANNUAL_RETURN_SHARE_COUNT_DIFFERENCE]: function(context, submit, reset){
        function skip(){
            return submit({
                pendingActions: [{id: context.actionSet.id, data: {...context.actionSet.data, userSkip: true, previous_id: context.actionSet.previous_id}}]
            })
        }
        function startOver(){
            return reset();
        }
        return <div className="button-row">
            <Button onClick={skip} className="btn-primary">Skip Annual Return Validation</Button>
            <Button onClick={startOver} className="btn-danger">Restart Import</Button>
        </div>
    },
    [ImportErrorTypes.UNKNOWN_AMEND]: function(context, submit){
        const { actionSet, companyState } = context;
        const amendActions = actionSet.data.actions.filter(a => [TransactionTypes.AMEND, TransactionTypes.NEW_ALLOCATION].indexOf(a.transactionType) >= 0);
        const shareClassMap = generateShareClassMap(companyState);
        const initialValues = {actions: amendActions.map(a => ({}))};
        return <div>
                <AmendOptionsConnected amendActions={amendActions} shareClassMap={shareClassMap} initialValues={initialValues} />
                </div>
    }
}



@connect((state, ownProps) => {
    return {

    };
}, (dispatch, ownProps) => {
    return {
        addNotification: (args) => dispatch(addNotification(args)),
        updateAction: (args) => {
            return dispatch(updateResource(`/company/${ownProps.modalData.companyId}/update_pending_history`, args, {
                invalidates: [`/company/${ownProps.modalData.companyId}/import_pending_history`]
            }))
            .then(() => {
                ownProps.end();
            })
        },
        resetAction: (args) => {
            return dispatch(updateResource(`/company/${ownProps.modalData.companyId}/reset_pending_history`, {}, {
            }))
            .then(() => {
                ownProps.end();
            })
        }
    }
})
export class ResolveAmbiguityModal extends React.Component {

    constructor(props){
        super(props);
    }

    renderBody() {
        const context = this.props.modalData.error.context || {};
        const action = context.action;
        if(!DESCRIPTIONS[action.transactionType]){
            return <div>Unknown Import Error</div>
        }
        return <div className="resolve">
            { DESCRIPTIONS[action.transactionType](context, this.props.modalData.companyState)}
            <hr/>
            { PAGES[context.importErrorType](context, this.props.updateAction, this.props.resetAction)}
        </div>
    }



    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Resolve Company Import Problem</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                { this.renderBody() }
              </Modal.Body>
              <Modal.Footer>
            <div className="button-row">
            <Button onClick={this.props.end} >Cancel</Button>
            </div>
              </Modal.Footer>
            </Modal>
    }
}
