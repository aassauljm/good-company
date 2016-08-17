"use strict";
import React, {PropTypes} from 'react';
import Modal from '../forms/modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from '../forms/input';
import STRINGS from '../../strings'
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { fieldStyle, fieldHelp, populatePerson, numberWithCommas } from '../../utils';
import { Link } from 'react-router';
import { companyTransaction, addNotification, showModal } from '../../actions';
import { push } from 'react-router-redux';
import LawBrowserLink from '../lawBrowserLink';
import { enums as TransactionTypes } from '../../../../config/enums/transactions';


function renderHolders(holding){
    return <ul>
        { holding.holders.map((h, i) => {
            return <li key={i}>{ h.person.name } </li>
        })}
    </ul>
}


export class VoterSelect extends React.Component {
    renderSelect(field, holders) {
        return <Input type="select" {...field} bsStyle={fieldStyle(field)} help={fieldHelp(field)}
            hasFeedback >
                { holders.map((h, i) => <option key={i} value={h.person.personId.toString()}>{h.person.name}</option> ) }
            </Input>
    }

    render() {
        return <table className="table table-striped">
            <thead>
            <tr><th>Name</th><th>Shareholders</th><th>Voting Shareholder</th></tr>
            </thead>
            <tbody>
                { this.props.companyState.holdingList.holdings.map((h, i) => {
                    return <tr key={i}>
                        <td>{ h.name }</td>
                        <td>{ renderHolders(h) }</td>
                        <td>{ this.renderSelect(this.props.fields[`${h.holdingId}`], h.holders) }</td>
                    </tr>
                })}
            </tbody>
        </table>
    }
}

const VoterSelectConnected = reduxForm({
  form: 'voterSelect'
})(VoterSelect);


function populateHolders(holdingId, companyState){
    let result;
    companyState.holdingList.holdings.map(h => {
        if(h.holdingId === holdingId){
            result = h;
        }
    });
    return result.holders.map(h => ({name: h.person.name, address: h.person.address, personId: h.person.personId, companyNumber: h.person.companyNumber}))
}


@connect(undefined)
export class VotingShareholdersModal extends React.Component {
    constructor(props) {
        super(props);
         this.submit = ::this.submit;
    }

    handleNext() {
        this.refs.form.submit();
    }

    submit(values) {
        const actions = [];
        Object.keys(values).map(k => {
            const holdingId = parseInt(k, 10);
            const person = populatePerson({personId: values[k]}, this.props.modalData.companyState);
            const holding = this.props.modalData.companyState.holdingList.holdings.filter(h => {
                return h.holdingId === holdingId;
              })[0];
            const currentVoter = holding.holders.filter(h => (h.data || {}).votingShareholder);
            let previousPerson = null;
            if(currentVoter.length){
                previousPerson =  populatePerson({personId: currentVoter[0].person.personId}, this.props.modalData.companyState);
            }
            actions.push({
                holdingId: holdingId,
                beforeHolders: populateHolders(holdingId, this.props.modalData.companyState),
                afterHolders: populateHolders(holdingId, this.props.modalData.companyState),
                afterVotingShareholder: person,
                beforeVotingShareholder: previousPerson,
                transactionType: TransactionTypes.HOLDING_CHANGE
            });
        });

        const transactions = [{
            transactionType: TransactionTypes.HOLDING_CHANGE,
            actions: actions
        }];

        this.props.dispatch(companyTransaction('compound',
                                this.props.modalData.companyId,
                                {transactions: transactions}))
            .then(() => {
                this.props.end({reload: true});
                this.props.dispatch(addNotification({message: 'Voting Shareholders applied'}));
                const key = this.props.modalData.companyId;
            })
            .catch((err) => {
                this.props.dispatch(addNotification({message: err.message, error: true}));
            });
    }

    renderBody(companyState) {
        const fields = companyState.holdingList.holdings.map(h => `${h.holdingId}`)
        const initialValues = companyState.holdingList.holdings.reduce((acc, holding, key) => {
            const voter = holding.holders.filter(h => (h.data || {}).votingShareholder)
            acc[holding.holdingId] = (voter.length ? voter : holding.holders)[0].person.personId;
            return acc;
        }, {})
        return <VoterSelectConnected ref="form" companyState={companyState}
            fields={fields} onSubmit={this.submit} initialValues={initialValues}/>
    }

    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Select Voting Shareholders</Modal.Title>
              </Modal.Header>
              <Modal.Body>
              <p><LawBrowserLink title="Companies Act 1993" location="sch 1 cl 11">Learn more about Voting Shareholders</LawBrowserLink></p>
                { this.renderBody(this.props.modalData.companyState) }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.props.end} >Close</Button>
                 <Button onClick={::this.handleNext} bsStyle="primary" className="submit">{ 'Submit' }</Button>
              </Modal.Footer>
            </Modal>
    }
}