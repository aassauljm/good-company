"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from '../forms/input';
import DateInput from '../forms/dateInput';
import { formFieldProps, requireFields } from '../../utils';
import { Link } from 'react-router';
import { companyTransaction, addNotification } from '../../actions';
import STRINGS from '../../strings';
import { Documents } from '../forms/documents';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const fields = ['effectiveDate', 'companyName', 'nzbn', 'companyNumber', 'addressForService', 'registeredCompanyAddress', 'arFilingMonth', 'fraReportingMonth', 'documents']


@formFieldProps()
export class CompanyDetails extends React.Component {
    render() {
        return <form className="form" >
        <fieldset>
            <DateInput {...this.formFieldProps('effectiveDate')} />
            <Input type="text" {...this.formFieldProps('companyName')} />
            <Input type="text" {...this.formFieldProps('nzbn')} />
            <Input type="text" {...this.formFieldProps('companyNumber')} />
            <Input type="text" {...this.formFieldProps('addressForService')} />
            <Input type="text" {...this.formFieldProps('registeredCompanyAddress')} />
            <Input type="select" {...this.formFieldProps('arFilingMonth')} >
                <option></option>
                { months.map((m, i) => {
                    return <option key={i} value={m}>{m}</option>
                }) }
            </Input>
            <Input type="select" {...this.formFieldProps('fraReportingMonth')} >
                <option></option>
                { months.map((m, i) => {
                    return <option key={i} value={m}>{m}</option>
                }) }
            </Input>
        </fieldset>
        <Documents documents={this.props.fields.documents} />
        </form>
    }
}

const validate = requireFields('effectiveDate', 'companyName', 'registeredCompanyAddress')


const CompanyDetailsConnected = reduxForm({
  form: 'companyInfo',
  fields,
  validate
})(CompanyDetails);


export function companyDetailsFormatSubmit(values, companyState){
    const actions = [];
    const transactionMap = {
        'addressForService': 'ADDRESS_CHANGE',
        'registeredCompanyAddress': 'ADDRESS_CHANGE',
        'companyName': 'NAME_CHANGE'
    };
    const fieldNameMap = {
        'addressForService': 'newAddress',
        'registeredCompanyAddress': 'newAddress',
        'companyName': 'newCompanyName'
    };
    const previousFieldNameMap = {
        'addressForService': 'previousAddress',
        'registeredCompanyAddress': 'previousAddress',
        'companyName': 'previousCompanyName'
    };
    fields.map(item => {
        if(item === 'effectiveDate'){
            return;
        }
        if(values[item] !== companyState[item]){
            actions.push({
                transactionType: transactionMap[item] || 'DETAILS',
                [fieldNameMap[item || 'value']]: values[item],
                [previousFieldNameMap[item || 'previousValue']]: companyState[item],
                field: item
            })
        }
    });
    return {
        actions: actions,
        effectiveDate: values.effectiveDate,
        transactionType: 'DETAILS'
    }

}


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
        const transaction = companyDetailsFormatSubmit(values, this.props.modalData.companyState);
        if(transaction.actions.length){
             this.props.dispatch(companyTransaction(
                                'compound',
                                this.props.modalData.companyId,
                                {transactions: [transaction], documents: values.documents} ))
            .then(() => {
                this.props.end({reload: true});
                this.props.dispatch(addNotification({message: 'Updated Company Details'}));
                const key = this.props.modalData.companyId;
            })
            .catch((err) => {
                this.props.dispatch(addNotification({message: err.message, error: true}));
            })
        }
        else{
            this.props.end();
        }
    }

    renderBody(companyState) {
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <CompanyDetailsConnected ref="form"
                    initialValues={{...companyState, effectiveDate: new Date() }}
                    onSubmit={this.submit}/>
                </div>
            </div>

    }

    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Update Company Details</Modal.Title>
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