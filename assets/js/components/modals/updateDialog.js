"use strict";
import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import Input from '../forms/input';
import STRINGS from '../../strings';
import { reduxForm } from 'redux-form';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { hideUpdate, companyTransaction, addNotification } from '../../actions';
import { connect } from 'react-redux';

const fields = [
    'includeTransactions[]'
]
@reduxForm({
    form: 'updateList',
    fields
})
export class UpdateForm extends React.Component {

    render(){
        return <table className="table table-striped">
            <thead>
                <tr>
                <th>Save</th>
                <th>Name</th>
                <th>Email</th>
                </tr>
                </thead>
                <tbody>
                    { this.props.transactions.map((t, i) => {
                        return <tr key={i}>
                            <td><Input type="checkbox" {...this.props.fields.includeTransactions[i]} label={false} /></td>
                            <td>{ t.actions[0].afterName }</td>
                            <td>{ t.actions[0].personAttr.email }</td>
                            </tr>
                    })}
                </tbody>
        </table>
    }
}


@connect(undefined,
{
    submit: (companyId, transactions, meta) => companyTransaction(
                                    'compound',
                                    companyId,
                                    {transactions: transactions}, {skipConfirmation: true}, meta),
    hide: () => hideUpdate(),
    update: (...args) => c(...args)
})
export default class UpdateDialog extends React.Component {
    constructor(props) {
        super(props);
        this.confirm = ::this.confirm;
        this.close = ::this.close;
    }

    confirm(values) {
        const confirmed = this.props.transactions.filter((t, i) => {
            return values.includeTransactions[i]
        });
        if(confirmed.length){
            this.props.submit(this.props.companyId, confirmed, {
                onSuccess: [addNotification({message: 'Email addresses updated'})],
                onFailure: [addNotification({message: 'Could not update email addresses at this time', error: true})]
            });
        }
        this.props.hide();
    }

    close() {
        this.props.hide();
    }

    render() {
        const transactions = this.props.transactions;
        return (
            <Modal show={true}  onHide={this.close} backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>Update Directors</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                <p>You have added email addresses following director(s).  Would you like to save them?</p>
                <UpdateForm ref="form" transactions={transactions} initialValues={{includeTransactions: transactions.map(t => true)}} onSubmit={this.confirm} />
                </Modal.Body>
                <Modal.Footer>
                    <Button bsStyle='default' onClick={this.close}>Close</Button>
                    <Button bsStyle='primary' onClick={() => this.refs.form.submit()}>Update</Button>
                </Modal.Footer>
            </Modal>
        );
        return false;
    }

}
