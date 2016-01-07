"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { numberWithCommas, fieldStyle, fieldHelp, formFieldProps, requireFields } from '../utils';
import { pushState } from 'redux-router';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import DateInput from './forms/dateInput';


const issueFields = [
    'effectiveDate',
    'parcels[].amount',
    'parcels[].shareClass'
];

@formFieldProps({
    labelClassName: 'col-xs-3',
    wrapperClassName: 'col-xs-3'
})
export class ParcelFields extends React.Component {
  static propTypes = {
        amount: PropTypes.object.isRequired,
        shareClass: PropTypes.object.isRequired,
        shareClasses: PropTypes.array.isRequired
    };

    renderShareClasses() {

        return <Input type="select"  {...this.formFieldProps('shareClass')}  >
            { this.props.shareClasses.filter(x => x.label).map((s, i) => {
                return <option value={s.label} key={i}>{s.label}</option>
            })}
        </Input>
    };

    render() {
        return <div>
                  <Input type="text" {...this.formFieldProps('amount')}  />
                  { this.renderShareClasses () }
        </div>
    }
}


@formFieldProps({
    labelClassName: 'col-xs-3',
    wrapperClassName: 'col-xs-9'
})
export class IssueForm extends React.Component {
    render() {
        return <form className='form-horizontal'>
            <fieldset>
            <legend>Issue Specifics</legend>
            <DateInput {...this.formFieldProps('effectiveDate') }/>
            { this.props.fields.parcels.map((parcel, index) => <div key={index}>
                <ParcelFields shareClasses={[{label: STRINGS.defaultShareClass}]} {...parcel }/>
                </div>) }
            <Button onClick={event => {
                event.preventDefault();   // prevent form submission
                this.props.fields.parcels.addField();
            }} >Add Parcel</Button>
            </fieldset>
        </form>
    }
}

const validateIssue = data => {
    const errors = {};
    return { ...requireFields('effectiveDate')(data), parcel: requireFields('amount')(data.parcel) }
}


export const IssueFormConnected = reduxForm({
    form: 'issue', fields: issueFields, validate: validateIssue
}, state => ({
    initialValues: {parcels: [{}]}
}))(IssueForm)

export class IssueModal extends React.Component {

    static propTypes = {
        modalData: PropTypes.object.isRequired,
    };

    componentWillUnmount() {
        this.refs.modal._onHide();
    }


    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Issue Shares</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                    <IssueFormConnected companyState={this.props.modalData } />
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.props.end} >Close</Button>
              </Modal.Footer>
            </Modal>
    }

}