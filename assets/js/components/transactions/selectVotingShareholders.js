"use strict";
import React, {PropTypes} from 'react';
import Modal from '../forms/modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from '../forms/input';
import STRINGS from '../../strings'
import { numberWithCommas } from '../../utils'
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { fieldStyle, fieldHelp } from '../../utils';
import { Link } from 'react-router';
import { companyTransaction, addNotification, showModal } from '../../actions';
import { push } from 'react-router-redux';
import LawBrowserLink from '../lawBrowserLink';

function renderHolders(holding){
    return <ul>
        { holding.holders.map((h, i) => {
            return <li key={i}>{ h.name } </li>
        })}
    </ul>
}


export class VoterSelect extends React.Component {
    static propTypes = {
        options: PropTypes.array.isRequired,
    };
    renderSelect(field, holders) {
        return <Input type="select" {...field} bsStyle={fieldStyle(field)} help={fieldHelp(field)}
            hasFeedback >
                <option></option>
                { holders.map((h, i) => <option key={i} value={h.personId.toString()}>{h.name}</option> ) }
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
        const holdings = [];
        Object.keys(values).map(k => {
            //if(!values[k]) return;
            holdings.push({
                holdingId: parseInt(k, 10),
                shareClass: parseInt(values[k], 10) || undefined,
                transactionType: 'APPLY_SHARE_CLASS'
            });
        });
        this.props.dispatch(companyTransaction('apply_share_classes',
                                this.props.modalData.companyId,
                                {actions: holdings}))
            .then(() => {
                this.props.end({reload: true});
                this.props.dispatch(addNotification({message: 'Share classes applied.'}));
                const key = this.props.modalData.companyId;
            })
            .then(() => {
                this.props.dispatch(showModal('importHistory', {companyState: this.props.modalData.companyState, companyId: this.props.modalData.companyId}));
                this.props.dispatch(push(`/company/view/${this.props.modalData.companyId}/new_transaction`));
            })

            .catch((err) => {
                this.props.dispatch(addNotification({message: err.message, error: true}));
            });
    }

    renderBody(companyState) {
        const fields = companyState.holdingList.holdings.map(h => `${h.holdingId}`)
        const initialValues = companyState.holdingList.holdings.reduce((acc, value, key) => {
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