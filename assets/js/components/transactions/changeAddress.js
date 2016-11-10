"use strict";
import React, {PropTypes} from 'react';
import Modal from '../forms/modal';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from '../forms/buttonInput';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { formFieldProps, requireFields, joinAnd, personList } from '../../utils';
import { showModal } from '../../actions';
import LawBrowserLink from '../lawBrowserLink'

import STRINGS from '../../strings';
import Input from '../forms/input';
import DateInput from '../forms/dateInput';

const fields = [
    'effectiveDate',
    'newAddress',
    'notice',
    'minNotice'
]

class AddressForm extends React.Component {
    render() {
        return <form className="form">
                <Input type="static" value={this.props.currentAddress} label="Current Address" />
                <Input type="text" {...this.props.fields.newAddress} label="New Address" />
                <DateInput {...this.props.fields.notice} label="Date of Notice to Registrar"  />
                <Input type="static" {...this.props.fields.minNotice} label="Earliest Change Date"  />
                <DateInput {...this.props.fields.effectiveDate}  label={STRINGS.effectiveDate}/>
        </form>
    }
}


const AddressForServiceFormConnected = reduxForm({
    fields,
    form: 'addressForService'
})(AddressForm);

function AddressForServiceLawLinks(){
    return <div>
        <LawBrowserLink title="Companies Act 1993" location="s 192">Requirement to have address for service</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 193">Change of address for service by board</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 193A, 360A, 360B">Cectification or correction of address for service</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 387(1)(c)">Service of documents in legal proceedings</LawBrowserLink>
    </div>
}

@connect(undefined)
export class ChangeAddressForServiceModal extends React.Component {
    constructor(props) {
        super(props);
        this.handleClose = ::this.handleClose;
    }

    handleClose(data={}) {
        this.props.end(data);
    }

    renderBody() {
        return <AddressForServiceFormConnected />
    }

    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'} lawLinks={AddressForServiceLawLinks()}>
              <Modal.Header closeButton>
                <Modal.Title>Update Address For Service</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                { this.renderBody() }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
              </Modal.Footer>
            </Modal>
    }

}