"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from '../forms/buttonInput';
import { connect } from 'react-redux';
import { reduxForm, change, destroy } from 'redux-form';
import { personOptionsFromState, generateShareClassMap } from '../../utils';
import { showTransactionView } from '../../actions';
import STRINGS from '../../strings';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { HoldingNoParcelsConnected, updateHoldingFormatAction, reformatPersons } from '../forms/holding';
import { HoldingDL } from '../shareholdings';


function updateHoldingSubmit(values, oldHolding){
    const actions = updateHoldingFormatAction(values, oldHolding);
    return [{
        transactionType: 'HOLDING_CHANGE',
        effectiveDate: values.effectiveDate,
        actions: [actions]
    }]
}


@connect(undefined)
export class SelectHoldingTransactionView extends React.Component {
    constructor(props) {
        super(props);
        this.handleClose = ::this.handleClose;
    }


    handleClose() {
        this.props.end();
    }

    renderBody() {
        const total = this.props.transactionViewData.companyState.totalShares;
        const shareClassMap = generateShareClassMap(this.props.transactionViewData.companyState)
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
            { this.props.transactionViewData.companyState.holdingList.holdings.map((h, i) => {
            const sum = h.parcels.reduce((acc, p) => acc + p.amount, 0),
                    percentage = (sum/total*100).toFixed(2) + '%';
            return <div className="holding well actionable" key={i} onClick={() => this.props.dispatch(showTransactionView('updateHolding', {...this.props.transactionViewData, holding: h}))}>
                    <HoldingDL holding={h} total={total} percentage={percentage}  shareClassMap={shareClassMap}/>
                </div>
            })
            }</div>
            </div>
    }


    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Select Shareholding</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody() }
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
              </TransactionView.Footer>
            </TransactionView>
    }
}