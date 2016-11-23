"use strict";
import React, {PropTypes} from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from '../forms/input';
import STRINGS from '../../strings'
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { fieldStyle, fieldHelp, populatePerson, numberWithCommas } from '../../utils';
import { Link } from 'react-router';
import { companyTransaction, addNotification, showTransactionView } from '../../actions';
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
                { this.props.holdings.map((h, i) => {
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
export class VotingShareholdersTransactionView extends React.Component {
    constructor(props) {
        super(props);
         this.submit = ::this.submit;
    }

    handleNext() {
        this.refs.form.submit();
    }

    submit(values) {
        const date = new Date();
        const actions = [];
        Object.keys(values).map(k => {
            const holdingId = parseInt(k, 10);
            const person = populatePerson({personId: values[k]}, this.props.transactionViewData.companyState);
            const holding = this.props.transactionViewData.companyState.holdingList.holdings.filter(h => {
                return h.holdingId === holdingId;
              })[0];
            const currentVoter = holding.holders.filter(h => (h.data || {}).votingShareholder);
            let previousPerson = null;
            if(currentVoter.length){
                previousPerson =  populatePerson({personId: currentVoter[0].person.personId}, this.props.transactionViewData.companyState);
            }
            actions.push({
                holdingId: holdingId,
                beforeHolders: populateHolders(holdingId, this.props.transactionViewData.companyState),
                afterHolders: populateHolders(holdingId, this.props.transactionViewData.companyState),
                afterVotingShareholder: person,
                beforeVotingShareholder: previousPerson,
                transactionType: TransactionTypes.HOLDING_CHANGE,
                effectiveDate: date
            });
        });

        const transactions = [{
            transactionType: TransactionTypes.HOLDING_CHANGE,
            actions: actions,
            effectiveDate: date
        }];

        this.props.dispatch(companyTransaction('compound',
                                this.props.transactionViewData.companyId,
                                {transactions: transactions}, {skipConfirmation: true}))
            .then(() => {
                this.props.end({reload: true});
                this.props.dispatch(addNotification({message: 'Voting Shareholders applied'}));
                const key = this.props.transactionViewData.companyId;
            })
            .catch((err) => {
                this.props.dispatch(addNotification({message: err.message, error: true}));
            });
    }

    renderBody(companyState) {
        const holdings = companyState.holdingList.holdings.filter(h => h.holders.length > 1);
        const fields = holdings.map(h => `${h.holdingId}`);
        const initialValues = holdings.reduce((acc, holding, key) => {
            const voter = holding.holders.filter(h => (h.data || {}).votingShareholder)
            acc[holding.holdingId] = (voter.length ? voter : holding.holders)[0].person.personId;
            return acc;
        }, {})
        return <VoterSelectConnected ref="form" holdings={holdings}
            fields={fields} onSubmit={this.submit} initialValues={initialValues}/>
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Select Voting Shareholders</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
              <p><LawBrowserLink title="Companies Act 1993" location="sch 1 cl 11">Learn more about Voting Shareholders</LawBrowserLink></p>
                { this.renderBody(this.props.transactionViewData.companyState) }
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={this.props.end} >Cancel</Button>
                 <Button onClick={::this.handleNext} bsStyle="primary" className="submit">Apply</Button>
              </TransactionView.Footer>
            </TransactionView>
    }
}