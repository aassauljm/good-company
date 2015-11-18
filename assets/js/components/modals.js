"use strict";
import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import {nextCreateCompany, endCreateCompany, addListEntry, removeListEntry} from '../actions';
import {reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import DatePicker from 'react-date-picker';
import { fieldStyle, requiredFields } from '../utils';

export class Address extends React.Component {
    render() {
        return <Input type="text" {...this.props}/>
    }
}


export class DateInput extends React.Component {

    render() {
         return <Input {...this.props} >
                    <DatePicker {...this.props}  />
          </Input>
    }
}


export class DirectorForm extends React.Component {
    static propTypes = {
        fields: React.PropTypes.object
    };

    render() {
        const labelClassName = 'col-xs-3', wrapperClassName = 'col-xs-8';
        const { fields: {name, address } } = this.props;
        return <div className="panel panel-default">
            <div className="panel-heading">Director
                <Button className="pull-right" bsSize='xs' aria-label="Close" onClick={() => this.props.remove('director', this.props.listIndex)}><span aria-hidden="true">&times;</span></Button>
            </div>
            <div className="panel-body">
                <Input type="text" {...name} label={STRINGS['name']} bsStyle={fieldStyle(name)} labelClassName={labelClassName} wrapperClassName={wrapperClassName}  />
                <Address type="text"  {...address}  label={STRINGS['address']} bsStyle={fieldStyle(address)} labelClassName={labelClassName} wrapperClassName={wrapperClassName}/>
                </div>
            </div>

    }
}

function validateDirector(values){
    const errors = {};
    if(!values.name){
        errors.name = ['Required']
    }
    if(!values.address){
        errors.address = ['Required']
    }
    return errors;
}

const DecoratedDirectorForm = reduxForm({
  form: 'director',
  fields: ['name', 'address'],
  validate: requiredFields.bind(this, ['name', 'address'])
})(DirectorForm)


export class DirectorsForm extends React.Component {
    static propTypes = {
        formData: React.PropTypes.object
    };

    getKey(d) {
        return `${this.props.formKey}.directors[${d}]`;
    }

    render() {
        return <form className="form-horizontal">
                   <fieldset>
                    <legend>Directors</legend>
                        { this.props.formData.directors.map((d, i) => {
                            return <DecoratedDirectorForm ref={d} key={d} listIndex={d} formKey={this.getKey()} remove={this.props.removeListEntry} />
                        })}
                    <div className="text-center"><Button bsStyle="success" onClick={() => {this.props.addListEntry('director') }}>Add New Director</Button></div>
                </fieldset>
            </form>
        }
    }



export class CompanyFieldsForm extends React.Component {
    static propTypes = {
        fields: React.PropTypes.object
    };

    render() {
        const { fields: {companyName, nzbn, incorporationDate, registeredCompanyAddress, addressForService} } = this.props;
        const labelClassName = 'col-xs-3', wrapperClassName = 'col-xs-9';
        return  (
         <form className="form-horizontal">
              <fieldset>
                <legend>Basic Info</legend>
                    <Input type="text" ref="companyName" {...companyName} bsStyle={fieldStyle(companyName)} label={STRINGS['companyName']} labelClassName={labelClassName} wrapperClassName={wrapperClassName}  />
                    <Input type="text" ref="nzbn" {...nzbn} bsStyle={fieldStyle(nzbn)} label={STRINGS['nzbn']} labelClassName={labelClassName} wrapperClassName={wrapperClassName}/>
                    <DateInput ref="incorporationDate" {...incorporationDate} bsStyle={fieldStyle(incorporationDate)}  label={STRINGS['incorporationDate']} labelClassName={labelClassName} wrapperClassName={wrapperClassName}/>
                    <Address ref="registeredCompanyAddress" {...registeredCompanyAddress} bsStyle={fieldStyle(registeredCompanyAddress)} label={STRINGS['registeredCompanyAddress']} labelClassName={labelClassName} wrapperClassName={wrapperClassName}/>
                    <Address ref="addressForService" {...addressForService} bsStyle={fieldStyle(addressForService)} label={STRINGS['addressForService']} labelClassName={labelClassName} wrapperClassName={wrapperClassName}/>
                </fieldset>
        </form> )
    }
}


const companyFields = ['companyName', 'nzbn', 'incorporationDate', 'addressForService', 'registeredCompanyAddress'];
const DecoratedCompanyFieldsForm = reduxForm({
    form: 'createCompany',
    fields: companyFields,
    validate: requiredFields.bind(null, companyFields)
})(CompanyFieldsForm);


@connect(state => ({formData: state.form.createCompany}))
export class CreateCompanyModal extends React.Component {

    pages = [
        function(){
            return   <DecoratedCompanyFieldsForm ref="form" />
        },
        function(){
            const directorKeys = this.props.formData.directors;
            return  <DirectorsForm ref="form"  addListEntry={this.props.addListEntry} removeListEntry={this.props.removeListEntry} directorKeys={directorKeys} />
        }

    ];
    handleNext() {
        console.log(this)
    }

    render() {
        return  <Modal show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Create a new Company</Modal.Title>
              </Modal.Header>

              <Modal.Body>
                    { this.pages[this.props.index].call(this) }
              </Modal.Body>

              <Modal.Footer>
                <Button onClick={this.props.end} >Close</Button>
                <Button onClick={::this.handleNext} bsStyle="primary">Next</Button>
              </Modal.Footer>
            </Modal>
    }
}




@connect(state => state.modals)
export default class Modals extends React.Component {
    render() {
        if(!this.props.showing){
            return false;
        }
        if(this.props.showing === 'createCompany'){
            return <CreateCompanyModal index={this.props.createCompany.index}
                next={() => {this.props.dispatch(nextCreateCompany())} }
                end={() => {this.props.dispatch(endCreateCompany())} }
                //formData={this.props.formData}
                removeListEntry={(key, index) => {this.props.dispatch(removeListEntry('createCompany', key, index))} }
                addListEntry={(key) => {this.props.dispatch(addListEntry('createCompany', key))} }
            />
        }
    }
}