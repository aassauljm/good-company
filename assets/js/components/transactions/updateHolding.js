"use strict";
import React, {PropTypes} from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from '../forms/buttonInput';
import { connect } from 'react-redux';
import { reduxForm, change, destroy } from 'redux-form';
import { personOptionsFromState, populatePerson } from '../../utils';
import { companyTransaction, addNotification, showTransactionView } from '../../actions';
import STRINGS from '../../strings';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { HoldingNoParcelsConnected, updateHoldingFormatAction, reformatPersons, updateHoldingSubmit } from '../forms/holding';
import { Documents } from '../forms/documents';
import { enums as TransactionTypes } from '../../../../config/enums/transactions';



@connect(undefined)
export class UpdateHoldingTransactionView extends React.Component {

    static propTypes = {
        transactionViewData: PropTypes.shape({
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
        const personOptions = personOptionsFromState(this.props.transactionViewData.companyState);
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <HoldingNoParcelsConnected
                    ref="form"
                    initialValues={{effectiveDate: new Date(),
                        persons: this.props.transactionViewData.holding.holders.map(p => ({...p.person, personId: p.person.personId + '', votingShareholder: (p.data || {}).votingShareholder})),
                        holdingName: this.props.transactionViewData.holding.name}}
                    personOptions={personOptions}
                    holding={this.props.transactionViewData.holding}
                    showTransactionView={(key, index) => this.props.dispatch(showTransactionView(key, {
                        ...this.props.transactionViewData,
                        formName: 'holding',
                        field: `persons[${index}].newPerson`,
                        afterClose: { // open this transactionView again
                            showTransactionView: {key: 'updateHolding', data: {...this.props.transactionViewData, index: this.props.index}}
                        }
                    }))}
                    onSubmit={this.submit}/>
                </div>
            </div>
    }

    submit(values) {
        if(values.persons.length > 1){
            values.votingShareholder = populatePerson(values.persons.filter(p => p.votingShareholder)[0], this.props.transactionViewData.companyState);
        }
        let previous = this.props.transactionViewData.holding.holders.filter(h => (h.data || {}).votingShareholder);
        if(previous.length){
            values.previousVotingShareholder = populatePerson(previous[0].person, this.props.transactionViewData.companyState)
        }
        values.persons = reformatPersons(values, this.props.transactionViewData.companyState);
        const transactions = updateHoldingSubmit(values, this.props.transactionViewData.holding)
        if(transactions.length){
            this.props.dispatch(companyTransaction(
                                'compound',
                                this.props.transactionViewData.companyId,
                                {transactions: transactions, documents: values.documents} ))
                .then(() => {
                    this.handleClose({reload: true});
                    this.props.dispatch(addNotification({message: 'Shareholding Updated'}));
                    const key = this.props.transactionViewData.companyId;
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
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Update Shareholding</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody() }
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
                <Button onClick={this.handleNext} bsStyle="primary">Update</Button>
              </TransactionView.Footer>
            </TransactionView>
    }
}