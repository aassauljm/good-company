"use strict";
import React, {PropTypes} from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from '../forms/buttonInput';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { formFieldProps, requireFields, joinAnd } from '../../utils';
import { companyTransaction, addNotification } from '../../actions';
import LawBrowserLink from '../lawBrowserLink'
import STRINGS from '../../strings';
import Input from '../forms/input';
import DateInput from '../forms/dateInput';
import moment from 'moment';
import { contactDetailsFormatSubmit } from '../forms/contactDetails';
import WorkingDayNotice from '../forms/workingDays';
import { Documents } from '../forms/documents';



const fields = [
    'effectiveDate',
    'newAddress',
    'noticeDate',
    'noticeDate',
    'documents'
]



@formFieldProps()
class AddressForm extends React.Component {
    render() {
        return <form className="form">
                <Input type="static" value={this.props.currentAddress} label="Current Address" />
                <Input type="text" {...this.formFieldProps('newAddress')} label="New Address" />
                <DateInput {...this.formFieldProps('noticeDate')} label="Date of Notice to Registrar" />
                <WorkingDayNotice field={this.props.fields.noticeDate} source={this.props.fields.noticeDate.value} days={5} label="Earliest Change Date"/>
                <DateInput {...this.formFieldProps('effectiveDate')} />
                <Documents documents={this.props.fields.documents}/>
        </form>
    }
}

const validateFields = requireFields('effectiveDate', 'newAddress', 'noticeDate', 'noticeDate');

const AddressFormConnected = reduxForm({
    fields,
    form: 'addressChange',
    validate: (values) => {
        const errors = validateFields(values);
        if(values.noticeDate && values.effectiveDate && values.effectiveDate < values.noticeDate){
            errors.effectiveDate = ['Must be at least 5 working days after date of notice']
        }
        return errors;
    }
})(AddressForm);

function AddressForServiceLawLinks(){
    return <div>
        <LawBrowserLink title="Companies Act 1993" location="s 192">Requirement to have address for service</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 193">Change of address for service by board</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 193A, 360A, 360B">Rectification or correction of address for service</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 387(1)(c)">Service of documents in legal proceedings</LawBrowserLink>
    </div>
}


function RegisteredAddressLawLinks(){
    return <div>
        <LawBrowserLink title="Companies Act 1993" location="s 186">Requirement to have New Zealand registered office</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 187">Change of registered office by board</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 188">Requirement to change registered office</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 360B">Rectification or correction of companies register</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 387(1)(c)">Service of documents in legal proceedings</LawBrowserLink>
    </div>
}


@connect(undefined, {
    submit: (type, id, values) => companyTransaction(type, id, values),
    addNotification: (args) => addNotification(args)
})
export class ChangeAddress extends React.Component {
    constructor(props) {
        super(props);
        this.handleClose = ::this.handleClose;
        this.handleSubmit = ::this.handleSubmit;
    }

    handleClose(data={}) {
        this.props.end(data);
    }


    handleSubmit(values) {
        const requiredValues = {[this.props.fieldName]: values.newAddress, effectiveDate: values.effectiveDate, noticeDate: values.noticeDate}
        const transactions = contactDetailsFormatSubmit(requiredValues, this.props.transactionViewData.companyState);
        if(!transactions[0].actions.length){
            return;
        }
        this.props.submit('compound',
                          this.props.transactionViewData.companyId,
                          {transactions: transactions,
                            documents: values.documents})
            .then(() => {
                this.props.addNotification({message: 'Address Updated'});
                this.handleClose({reload: true})
            })
            .catch((err) => {
                this.props.addNotification({message: err.message, error: true});
            })
    }

    renderBody() {
       return <AddressFormConnected ref="form" currentAddress={this.props.transactionViewData.companyState[this.props.fieldName]} onSubmit={this.handleSubmit}/>
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'} lawLinks={this.props.lawLinks}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>{this.props.title}</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody() }
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
                <Button bsStyle="primary" onClick={() => this.refs.form.submit()}>Submit</Button>
              </TransactionView.Footer>
            </TransactionView>
    }
}

export const ChangeAddressForServiceTransactionView = (props) => {
    return <ChangeAddress {...props} fieldName={'addressForService'} title={'Change Address for Service'} lawLinks={AddressForServiceLawLinks()}/>
};

export const ChangeRegisteredOfficeTransactionView = (props) => {
    return <ChangeAddress {...props} fieldName={'registeredCompanyAddress'} title={'Change Registered Office'} lawLinks={RegisteredAddressLawLinks()}/>
};


