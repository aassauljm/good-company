"use strict";
import React from 'react';
import { Link } from 'react-router'
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import STRINGS from '../strings'
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from './forms/input';
import DateInput from './forms/dateInput';
import { formFieldProps, requireFields, pureRender } from '../utils';
import { companyTransaction, addNotification } from '../actions';


const standardFields = ['registeredCompanyAddress', 'addressForService'];
const defaultCustomFields = ['Address for Inspection of Records', 'Head Office', 'Branch Offices', 'Website URL', 'Email', 'Phone', 'Fax', 'Lawyers', 'Accountants', 'Bank'];


const fields = [
    ...standardFields,
    'userFields[].label',
    'userFields[].value',

]


export class ContactDetailsWidget extends React.Component {
    key() {
        return this.props.companyId;
    }
    renderBody() {
        let bodyClass = "widget-body expandable ";
        if(this.props.expanded){
            bodyClass += "expanded ";
        }

        const data = this.props.companyState, userFields = data.userFields || {};
        return  <div className="widget-body"  className={bodyClass} onClick={() => this.props.toggle(!this.props.expanded)}>
            <div className="row" key="body">
                <div className="col-xs-12">
                    { standardFields.map((f, i) =>  <div key={i}><strong>{ STRINGS[f] } </strong> {data[f] }</div>) }
                    { defaultCustomFields.map((f, i) => userFields[f] && <div key={i}><strong>{ f } </strong> {userFields[f] }</div>) }
                </div>
            </div>
        </div>
    }

    render() {
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    Contact
                </div>
                <div className="widget-control">
                 <Link to={`/company/view/${this.key()}/contact`} >View All</Link>
                </div>
            </div>
            { this.renderBody() }
        </div>
    }
}

const labelClassName = 'col-sm-4';
const wrapperClassName = 'col-sm-8';
@formFieldProps({
    labelClassName: labelClassName,
    wrapperClassName: wrapperClassName ,
})
export class ContactForm extends React.Component {
    render() {
        const userFields = this.props.fields.userFields;
        return <form className="form form-horizontal" >
        <fieldset>
            {standardFields.map((f, i) => {
                return <div className="row" key={i}><Input type="text" {...this.formFieldProps(f)} /></div>
            }) }
            { userFields.map((f, i) => {
                return <div className="row" key={i}>
                    <div className="form-group">
                        <div className={labelClassName}>
                            <input type="text" className='form-control' {...f.label} placeholder='Label'/>
                        </div>
                        <div className={wrapperClassName}>
                            <div className="input-group">
                            <input className='form-control' type="text" {...f.value}  />
                            <span className="input-group-btn">
                                { i > 0  && <button type="button" className="btn btn-default" onClick={() => userFields.swapFields(i, i - 1) }><Glyphicon glyph="arrow-up" /></button> }
                                { i < userFields.length - 1  && <button type="button" className="btn btn-default"onClick={() => userFields.swapFields(i, i + 1) }><Glyphicon glyph="arrow-down" /></button> }
                                <button type="button" className="btn btn-default"onClick={() => userFields.removeField(i) }><Glyphicon glyph="remove" /></button>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            }) }
            <button type="button" className="btn btn-success"
            onClick={() => {
                this.props.fields.userFields.addField({})
            }}
            >Add Field</button>
        </fieldset>
        </form>
    }
}

const validate = requireFields('registeredCompanyAddress', 'addressForService')


const ContactFormConnected = reduxForm({
  form: 'contactDetails',
  validate
})(ContactForm);


@pureRender
export default class ContactDetails extends React.Component {
    render() {
        const data = this.props.companyState, userFields = data.userFields || defaultCustomFields.map(f => ({
            value: '',
            label: f
        }));

        return <div className="container">
            <div className="">
                <ContactFormConnected
                    fields={fields}
                    initialValues={{...data, userFields : userFields}}

                />
            </div>
        </div>
    }
}