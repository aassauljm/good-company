"use strict";
import React, {PropTypes} from 'react';
import Modal from '../forms/modal';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from '../forms/buttonInput';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { formFieldProps, requireFields, joinAnd } from '../../utils';
import { requestWorkingDayOffset, companyTransaction, addNotification } from '../../actions';
import LawBrowserLink from '../lawBrowserLink'
import { fetch } from '../../utils';
import STRINGS from '../../strings';
import Input from '../forms/input';
import DateInput from '../forms/dateInput';
import moment from 'moment';
import { contactDetailsFormatSubmit } from '../forms/contactDetails';
import { Documents } from '../forms/documents';



const fields = [
    'effectiveDate',
    'newAddress',
    'noticeDate',
    'minNotice',
    'documents'
]

@connect(undefined, {
    requestWorkingDayOffset: (options) => requestWorkingDayOffset(options)
})
class WorkingDayNotice extends React.Component {

    fetch(source) {
        if(source) {
            this.props.requestWorkingDayOffset({
                scheme: 'companies',
                start_date: moment(source).format('YYYY-MM-DD'),
                amount: this.props.days,
                direction: 'positive',
                inclusion: 0,
                units: 'working_days'
            })
                .then(result => {
                    console.log(result);
                    this.props.field.onChange(moment(result.response.result, 'YYYY-MM-DD').toDate())
                })
        }
    }

    componentWillMount() {
        this.fetch(this.props.source)
    }

    componentWillReceiveProps(newProps) {
        if(newProps.source !== this.props.source){
            this.fetch(newProps.source)
        }
    }

    render() {
        return <Input type="static" value={this.props.field.value ? moment(this.props.field.value).format("DD/MM/YYYY") : ''} label={this.props.label} />
    }
}

@formFieldProps()
class AddressForm extends React.Component {
    render() {
        return <form className="form">
                <Input type="static" value={this.props.currentAddress} label="Current Address" />
                <Input type="text" {...this.formFieldProps('newAddress')} label="New Address" />
                <DateInput {...this.formFieldProps('noticeDate')} label="Date of Notice to Registrar" />
                <WorkingDayNotice field={this.props.fields.minNotice} source={this.props.fields.noticeDate.value} days={5} label="Earliest Change Date"/>
                <DateInput {...this.formFieldProps('effectiveDate')} />
                <Documents documents={this.props.fields.documents}/>
        </form>
    }
}

const validateFields = requireFields('effectiveDate', 'newAddress', 'noticeDate', 'minNotice');

const AddressForServiceFormConnected = reduxForm({
    fields,
    form: 'addressForService',
    validate: (values) => {
        const errors = validateFields(values);
        if(values.minNotice && values.effectiveDate && values.effectiveDate < values.minNotice){
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
        const transactions = contactDetailsFormatSubmit(requiredValues, this.props.modalData.companyState);
        if(!transactions[0].actions.length){
            return;
        }
        this.props.submit('compound',
                          this.props.modalData.companyId,
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
       return <AddressForServiceFormConnected ref="form" currentAddress={this.props.modalData.companyState.addressForService} onSubmit={this.handleSubmit}/>
    }

    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'} lawLinks={this.props.lawLinks}>
              <Modal.Header closeButton>
                <Modal.Title>{this.props.title}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                { this.renderBody() }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
                <Button bsStyle="primary" onClick={() => this.refs.form.submit()}>Submit</Button>
              </Modal.Footer>
            </Modal>
    }
}

export const ChangeAddressForServiceModal = (props) => {
    return <ChangeAddress {...props} fieldName={'addressForService'} title={'Change Address for Service'} lawLinks={AddressForServiceLawLinks()}/>
};

export const ChangeRegisteredOfficeModal = (props) => {
    return <ChangeAddress {...props} fieldName={'registeredCompanyAddress'} title={'Change Registered Office'} lawLinks={RegisteredAddressLawLinks()}/>
};


