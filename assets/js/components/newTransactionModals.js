"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { numberWithCommas, fieldStyle, fieldHelp, requiredFields, formFieldProps } from '../utils';
import { pushState } from 'redux-router';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import DateInput from './forms/dateInput';


const issueFields = [
    'effectiveDate',
    'parcel.amount',
    'parcel.shareClass'
]


@formFieldProps({
    labelClassName: 'col-xs-3',
    wrapperClassName: 'col-xs-9'
})
export class IssueForm extends React.Component {
    render() {
        return <form className='form-horizontal'>

            <DateInput {...this.formFieldProps('effectiveDate') }/>
        </form>
    }
}


export const IssueFormConnected = reduxForm({form: 'issue', fields: issueFields})(IssueForm)

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