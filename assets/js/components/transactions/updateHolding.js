"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from 'react-bootstrap/lib/ButtonInput';
import { connect } from 'react-redux';
import { reduxForm, change, destroy } from 'redux-form';
import { personOptionsFromState } from '../../utils';
import { companyTransaction, addNotification, showModal } from '../../actions';
import { routeActions } from 'react-router-redux';
import STRINGS from '../../strings';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { HoldingNoParcelsConnected, updateHoldingFormatAction, reformatPersons } from '../forms/holding';
import { HoldingDL } from '../company';


function updateHoldingSubmit(values, oldHolding){
    const actions = updateHoldingFormatAction(values, oldHolding);
    return [{
        transactionType: 'HOLDING_CHANGE',
        effectiveDate: values.effectiveDate,
        actions: [actions]
    }]
}


@connect(undefined)
export class UpdateHoldingModal extends React.Component {
    constructor(props) {
        super(props);
        this.submit = ::this.submit;
        this.handleClose = ::this.handleClose;
        this.handleNext = ::this.handleNext;
    }

    handleNext() {
        this.refs.form.submit();
    }

    handleClose() {
        this.props.dispatch(destroy('holding'));
        this.props.end();
    }

    pages = [
        () => {
            const total = this.props.modalData.companyState.totalShares;
            return <div className="row">
                <div className="col-md-6 col-md-offset-3">
                { this.props.modalData.companyState.holdingList.holdings.map((h, i) => {
                const sum = h.parcels.reduce((acc, p) => acc + p.amount, 0),
                        percentage = (sum/total*100).toFixed(2) + '%';
                return <div className="holding well actionable" key={i} onClick={() => this.props.next({...this.props.modalData, holding: h})}>
                        <HoldingDL holding={h} total={total} percentage={percentage}  />
                    </div>
                })
                }</div>
                </div>
        },
        () => {
            const personOptions = personOptionsFromState(this.props.modalData.companyState);
            return <div className="row">
                <div className="col-md-6 col-md-offset-3">
                    <HoldingNoParcelsConnected
                        ref="form"
                        initialValues={{effectiveDate: new Date(), persons: this.props.modalData.holding.holders, holdingName: this.props.modalData.holding.name}}
                        personOptions={personOptions}
                        showModal={(key, index) => this.props.dispatch(showModal(key, {
                            ...this.props.modalData,
                            formName: 'holding',
                            field: `persons[${index}].newPerson`,
                            afterClose: { // open this modal again
                                showModal: {key: 'updateHolding', data: {...this.props.modalData, index: this.props.index}}
                            }
                        }))}
                        onSubmit={this.submit}/>
                    </div>
                </div>
        }
    ]

    submit(values) {
        values.persons = reformatPersons(values, this.props.modalData.companyState);
        const transactions = updateHoldingSubmit(values, this.props.modalData.holding)
        if(transactions.length){
            this.props.dispatch(companyTransaction(
                                    'compound',
                                    this.props.modalData.companyId,
                                    {transactions: transactions} ))
                .then(() => {
                    this.handleClose();
                    this.props.dispatch(addNotification({message: 'Shareholding Updated'}));
                    const key = this.props.modalData.companyId;
                    this.props.dispatch(routeActions.push(`/company/view/${key}`))
                })
                .catch((err) => {
                    this.props.dispatch(addNotification({message: err.message, error: true}));
                })
        }
        else{
            this.handleClose();
        }
    }


    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Update Shareholding</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                { this.pages[this.props.index].call(this) }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
                { this.props.index === 1 && <Button onClick={this.handleNext} bsStyle="primary">Create</Button> }
              </Modal.Footer>
            </Modal>
    }
}