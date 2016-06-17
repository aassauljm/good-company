"use strict";
import React, { PropTypes } from 'react';
import { requestResource, updateResource, showModal, addNotification } from '../../actions';
import { pureRender, stringToDate, stringToDateTime } from '../../utils';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import { Link } from 'react-router'
import STRINGS from '../../strings'
import { asyncConnect } from 'redux-connect';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { push } from 'react-router-redux'
import Modal from '../forms/modal';
import { enums as ImportErrorTypes } from '../../../../config/enums/importErrors';
import { enums as TransactionTypes } from '../../../../config/enums/transactions';
import { Holding } from '../shareholdings';

function companiesOfficeDocumentUrl(companyState, documentId){
    const companyNumber = companyState.companyNumber;
    return `http://www.business.govt.nz/companies/app/ui/pages/companies/${companyNumber}/${documentId}/entityFilingRequirement`;
}


const DESCRIPTIONS = {
    [TransactionTypes.HOLDING_CHANGE]: function(context, companyState){
        const { action, actionSet } = context;
        function holders(h, i){
            return <div key={i}>
                <div className="name">{ h.name }{h.companyNumber && ` (${h.companyNumber})`}</div>
                <div className="address">{ h.address }</div>
            </div>
        }
        return <div>
                <div className="row">
                    <div className="col-md-6 col-md-offset-3">
                    <div className="summary outline">
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
                        { action.beforeHolders.map(holders) }
                        </div>
                    </div>
                    <div className="col-md-2">
                        <div className="text-center">
                            <Glyphicon glyph="arrow-right" className="big-arrow"/>
                        </div>
                    </div>
                    <div className="col-md-5">
                        <div className="shareholding action-description ">
                        { action.afterHolders.map(holders) }
                        </div>
                    </div>
                </div>
        </div>
    }
}

const PAGES = {
    [ImportErrorTypes.MULTIPLE_HOLDINGS_FOUND]: function(context, companyState, submit){
        const { possibleMatches } = context;
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
                pendingActions: [{id: context.actionSet.id, data: updatedActions}]
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
    }
}



@connect((state, ownProps) => {
    return {

    };
}, (dispatch, ownProps) => {
    return {
        addNotification: (args) => dispatch(addNotification(args)),
        updateAction: (args) => dispatch(updateResource(`/company/${ownProps.modalData.companyId}/update_pending_history`, args, {
            invalidates: [`/company/${ownProps.modalData.companyId}/import_pending_history`]
        }))
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
            { PAGES[context.importErrorType](context, this.props.modalData.companyState, this.props.updateAction)}
        </div>
    }


    handleResolve() {
        this.props.showResolve(this.props.modalData);
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
