"use strict";
import React, {PropTypes} from 'react';
import Modal from '../forms/modal';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from '../forms/buttonInput';
import { connect } from 'react-redux';
import { reduxForm, change, destroy } from 'redux-form';
import { personOptionsFromState, generateShareClassMap } from '../../utils';
import { showModal } from '../../actions';
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
export class SelectHoldingModal extends React.Component {
    constructor(props) {
        super(props);
        this.handleClose = ::this.handleClose;
    }


    handleClose() {
        this.props.end();
    }

    renderBody() {
        const total = this.props.modalData.companyState.totalShares;
        const shareClassMap = generateShareClassMap(this.props.modalData.companyState)
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
            { this.props.modalData.companyState.holdingList.holdings.map((h, i) => {
            const sum = h.parcels.reduce((acc, p) => acc + p.amount, 0),
                    percentage = (sum/total*100).toFixed(2) + '%';
            return <div className="holding well actionable" key={i} onClick={() => this.props.dispatch(showModal('updateHolding', {...this.props.modalData, holding: h}))}>
                    <HoldingDL holding={h} total={total} percentage={percentage}  shareClassMap={shareClassMap}/>
                </div>
            })
            }</div>
            </div>
    }


    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Select Shareholding</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                { this.renderBody() }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
              </Modal.Footer>
            </Modal>
    }
}