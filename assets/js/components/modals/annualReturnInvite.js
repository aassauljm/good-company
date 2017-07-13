"use strict";
import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import STRINGS from '../../strings';
import { createResource, hideARInvite, addNotification, requestWorkingDayOffset } from '../../actions';
import { connect } from 'react-redux';
import { EmailListForm } from '../forms/email'
import moment from 'moment';
import { reduxForm } from 'redux-form';
import Input from '../forms/input';
/*
"Invite others to review the annual return by entering their name and email below, or selecting them from the existing users list.  They will receive an email containing a link to review the annual return, notify necessary changes, and confirm the filing of the annual return with the Companies Office."
*/


@connect(state => ({transactionViews: state.transactionViews || DEFAULT_OBJ}),
{
    hide: () => hideARInvite(),
    invite: (...args) => createResource(...args),
    addNotification: (data) => addNotification(data),
    requestWorkingDayOffset: (options) => requestWorkingDayOffset(options)
})
@reduxForm({
    form: 'inviteDate',
    fields: ['date']
})
export default class AnnualReturnConfirmationInvite extends React.PureComponent {
    constructor() {
        super();
        this.send = ::this.send;
        this.close = ::this.close;
    }

    send(values) {
        if(this._submitting){
            return;
        }
        this._submitting = true;
        const data = {
            year: this.props.renderData.arData.companyFilingYear,
            arData: this.props.renderData.arData,
            arConfirmationRequests: values.recipients.map((r) => {
                return {...r, requestBy: this.props.fields.date.value}
            })
        }
        const url = `/company/${this.props.renderData.companyId}/ar_confirmation`;
        this.props.invite(url, data)
            .then(() => {
                this.props.addNotification({
                    message: 'Review invitations sent'
                });
                this.close();
            }).catch((error) => {
                this.props.addNotification({
                    message: 'Failed to send review invitations',
                    error: true
                });
            })
            .then(() => {
                this._submitting = false;
            });
    }

    componentDidMount() {
        const year = this.props.renderData.arData.companyFilingYear;
        const month = this.props.renderData.arData.arFilingMonth;
        const format = 'YYYY-MM-DD'
        const firstDayOfNextMonth = moment().year(year).month(month).day(1).endOf('month').startOf('day').add(1, 'day').format(format)

        return this.props.requestWorkingDayOffset({
                scheme: 'companies',
                start_date: firstDayOfNextMonth,
                amount: 1,
                direction: 'negative',
                inclusion: 0,
                units: 'working_days'
            })
            .then((result) => {
                this.props.fields.date.onChange(moment(result.response.result, 'YYYY-MM-DD').format('D MMMM YYYY'));
            })
    }

    close() {
        this.props.hide();
    }

    render() {


        return (
            <Modal show={true} onHide={this.close}  backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>Invite Others to Review Annual Return</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Add names and email address below to invite others to review the current annual return.  </p>
                    <p>They will receive a link to view and confirm the accuracy of the document, and if necessary, provide feedback for you to evaulate.</p>
                    <p></p>
                    <EmailListForm initialValues={{recipients: [{}]}} ref="form" onSubmit={this.send} />
                    <Input type="text" {...this.props.fields.date} label="Request a response by" help="Defaults to last working day of the due month"/>
                </Modal.Body>
                <Modal.Footer>
                    <Button bsStyle='default' onClick={this.close}>Cancel</Button>
                    <Button bsStyle='primary' onClick={() => this.refs.form.submit()}>Send Review Requests</Button>
                </Modal.Footer>
            </Modal>
        );
        return false;
    }

}
