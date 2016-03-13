"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from '../forms/input';
import { numberWithCommas } from '../../utils'
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { fieldStyle, fieldHelp, formFieldProps } from '../../utils';
import { Link } from 'react-router';
import { companyTransaction, addNotification } from '../../actions';
import { routeActions } from 'react-router-redux';
import STRINGS from '../../strings';


/*
    companyName: 'Company Name',
    nzbn: 'NZBN',
    companyNumber: 'Company Number',
    addressForService: 'Address for Service',
    registeredCompanyAddress: 'Registered Company Address',
    AR Filing Month,
    ultimate holding company,
*/

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const fields = ['companyName', 'nzbn', 'companyNumber', 'addressForService', 'registeredCompanyAddress', 'arFilingMonth', 'fraReportingMonth']


@formFieldProps()
export class CompanyDetails extends React.Component {
    render() {
        return <form className="form">
        <fieldset>
            <Input type="text" {...this.formFieldProps('companyName')} />
            <Input type="text" {...this.formFieldProps('nzbn')} />
            <Input type="text" {...this.formFieldProps('companyNumber')} />
            <Input type="text" {...this.formFieldProps('addressForService')} />
            <Input type="text" {...this.formFieldProps('registeredCompanyAddress')} />
            <Input type="select" {...this.formFieldProps('arFilingMonth')} >
                { months.map((m, i) => {
                    return <option key={i} value={m}>{m}</option>
                }) }
            </Input>
            <Input type="select" {...this.formFieldProps('fraReportingMonth')} >
                { months.map((m, i) => {
                    return <option key={i} value={m}>{m}</option>
                }) }
            </Input>
        </fieldset>
        </form>
    }
}

const CompanyDetailsConnected = reduxForm({
  form: 'companyInfo',
  fields: fields
})(CompanyDetails);



@connect(undefined)
export class CompanyDetailsModal extends React.Component {
    constructor(props) {
        super(props);
         this.submit = ::this.submit;
    }

    handleNext() {
        this.refs.form.submit();
    }

    submit(values) {
        alert('to do')
        /*const holdings = [];
        Object.keys(values).map(k => {
            if(!values[k]) return;
            holdings.push({
                holdingId: parseInt(k, 10),
                shareClass: parseInt(values[k], 10),
                transactionType: 'APPLY_SHARE_CLASS'
            });
        });
        this.props.dispatch(companyTransaction('apply_share_classes',
                                this.props.modalData.companyId,
                                {actions: holdings}))
            .then(() => {
                this.props.end();
                this.props.dispatch(addNotification({message: err.message, error: true}));
                const key = this.props.modalData.companyId;
                this.props.dispatch(routeActions.push(`/company/view/${key}`))
            })
            .catch((err) => {
                this.props.dispatch(addNotification({message: err.message, error: true}));
            });*/
    }

    renderBody(companyState) {
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <CompanyDetailsConnected ref="form" companyState={companyState} initialValues={companyState} onSubmit={this.submit}/>
                </div>
            </div>

    }

    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Company Details</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                { this.renderBody(this.props.modalData.companyState) }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.props.end} >Close</Button>
                 <Button onClick={::this.handleNext} bsStyle="primary">{ 'Submit' }</Button>
              </Modal.Footer>
            </Modal>
    }

}