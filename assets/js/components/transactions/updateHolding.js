"use strict";
import React, {PropTypes} from 'react';
import Modal from '../forms/modal';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from '../forms/buttonInput';
import { connect } from 'react-redux';
import { reduxForm, change, destroy } from 'redux-form';
import { personOptionsFromState, populatePerson } from '../../utils';
import { companyTransaction, addNotification, showModal } from '../../actions';
import STRINGS from '../../strings';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { HoldingNoParcelsConnected, updateHoldingFormatAction, reformatPersons, updateHoldingSubmit } from '../forms/holding';
import { Documents } from '../forms/documents';
import { enums as TransactionTypes } from '../../../../config/enums/transactions';



@connect(undefined)
export class UpdateHoldingModal extends React.Component {

    static propTypes = {
        modalData: PropTypes.shape({
            holding: PropTypes.object.isRequired
        }).isRequired
    }

    constructor(props) {
        super(props);
        this.submit = ::this.submit;
        this.handleClose = ::this.handleClose;
        this.handleNext = ::this.handleNext;
    }


    handleNext() {
        this.refs.form.submit();
    }

    handleClose(data={}) {
        this.props.dispatch(destroy('holding'));
        this.props.end(data);
    }

    renderBody(){
        const personOptions = personOptionsFromState(this.props.modalData.companyState);
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <HoldingNoParcelsConnected
                    ref="form"
                    initialValues={{effectiveDate: new Date(),
                        persons: this.props.modalData.holding.holders.map(p => ({...p.person, personId: p.person.personId + '', votingShareholder: (p.data || {}).votingShareholder})),
                        holdingName: this.props.modalData.holding.name}}
                    personOptions={personOptions}
                    holding={this.props.modalData.holding}
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

    submit(values) {
        values.votingShareholder = populatePerson(values.persons.filter(p => p.votingShareholder)[0], this.props.modalData.companyState);
        let previous = this.props.modalData.holding.holders.filter(h => (h.data || {}).votingShareholder);
        if(previous.length){
            values.previousVotingShareholder = populatePerson(previous[0].person, this.props.modalData.companyState)
        }
        values.previousVotingShareholder = populatePerson(values.persons.filter(p => p.votingShareholder)[0], this.props.modalData.companyState);
        values.persons = reformatPersons(values, this.props.modalData.companyState);
        const transactions = updateHoldingSubmit(values, this.props.modalData.holding)
        if(transactions.length){
            this.props.dispatch(companyTransaction(
                                'compound',
                                this.props.modalData.companyId,
                                {transactions: transactions, documents: values.documents} ))
                .then(() => {
                    this.handleClose({reload: true});
                    this.props.dispatch(addNotification({message: 'Shareholding Updated'}));
                    const key = this.props.modalData.companyId;
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
                { this.renderBody() }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
                <Button onClick={this.handleNext} bsStyle="primary">Update</Button>
              </Modal.Footer>
            </Modal>
    }
}