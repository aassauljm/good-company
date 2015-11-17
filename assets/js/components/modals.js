"use strict";
import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import {nextCreateCompany, endCreateCompany} from '../actions';
import {reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import DatePicker from 'react-date-picker';


export class Address extends React.Component {
    render() {
        return <Input type="text" {...this.props}/>
    }
}


export class DateInput extends React.Component {

    render() {
        console.log(this.props)
         return <Input {...this.props} >
                    <DatePicker {...this.props}  />
          </Input>
    }
}



export class CreateCompanyForm extends React.Component {

    pages = [
        function(){
            const { fields } = this.props;
            const labelClassName = 'col-xs-3', wrapperClassName = 'col-xs-9';
            const self  = this;

            return  <form className="form-horizontal">
                      <fieldset>
                        <legend>Directors</legend>
                            { Array(this.props.values.directorCount || 1).fill().map((item, index) => {
                                const fieldName = name => { return `directors[${index}].${name}`; };
                                return (
                                  <div key={index}>
                                    <Input type="text" {...fields[fieldName('name')]} label={STRINGS['name']} labelClassName={labelClassName} wrapperClassName={wrapperClassName}  />
                                    <Address type="text"  {...fields[fieldName('address')]}  label={STRINGS['address']} labelClassName={labelClassName} wrapperClassName={wrapperClassName}/>
                                  </div>
                                );
                            })
                        }
                        <Button bsStyle="success" onClick={::this.addNewDirector}>Add New</Button>
                        </fieldset>
                    </form>
        },
        function(){
            const { fields: {companyName, nzbn, incorporationDate, registeredCompanyAddress, addressForService} } = this.props;
            const labelClassName = 'col-xs-3', wrapperClassName = 'col-xs-9';
            return  <form className="form-horizontal">
                      <fieldset>
                        <legend>Basic Info</legend>
                            <Input type="text" ref="companyName" {...companyName} label={STRINGS['companyName']} labelClassName={labelClassName} wrapperClassName={wrapperClassName}  />
                            <Input type="text" ref="nzbn" {...nzbn} label={STRINGS['nzbn']} labelClassName={labelClassName} wrapperClassName={wrapperClassName}/>
                            <DateInput ref="incorporationDate" {...incorporationDate} label={STRINGS['incorporationDate']} labelClassName={labelClassName} wrapperClassName={wrapperClassName}/>
                            <Address ref="registeredCompanyAddress" {...registeredCompanyAddress} label={STRINGS['registeredCompanyAddress']} labelClassName={labelClassName} wrapperClassName={wrapperClassName}/>
                            <Address ref="addressForService" {...addressForService} label={STRINGS['addressForService']} labelClassName={labelClassName} wrapperClassName={wrapperClassName}/>
                        </fieldset>
                    </form>
        },

    ];

    addNewDirector() {
        this.props.fields.directorCount.onChange((this.props.values.directorCount || 1) + 1);
    };


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
                <Button onClick={this.props.next} bsStyle="primary">Next</Button>
              </Modal.Footer>
            </Modal>
    }
}

const DecoratedCreateCompanyForm = reduxForm({form: 'createCompany'})(CreateCompanyForm);

export class CreateCompany extends React.Component {
    render() {

        const directorFields = Array((this.props.formData.directorCount || {}).value || 1).fill().reduce((accumulator, item, index) => {
            ['name', 'address'].map((key) => accumulator.push(`directors[${index}].${key}`));
          return accumulator;
        }, []);
        const fields = ['directorCount', 'companyName', 'nzbn', 'incorporationDate', 'addressForService', 'registeredCompanyAddress'].concat(directorFields);
        return <DecoratedCreateCompanyForm {...this.props} fields={fields} />
    }

}

/*export const DecoratedCreateCompany  = reduxForm({
  form: 'createCompany',
  fields: ['companyName', 'nzbn', 'incorporationDate', 'addressForService', 'registeredCompanyAddress']
})(CreateCompany)*/
/*         const itemFields = this.state.user.items.reduce((accumulator, item, index) => {
              Object.keys(item).map((key) => accumulator.push(`items[${index}].${key}`));
              return accumulator;
            }, []);*/

@connect(state => ({...state.modals, form: state.form.createCompany}))
export default class Modals extends React.Component {
    render() {
        if(!this.props.showing){
            return false;
        }
        if(this.props.showing === 'createCompany'){
            return <CreateCompany index={this.props.createCompany.index}
                next={() => {this.props.dispatch(nextCreateCompany())} }
                end={() => {this.props.dispatch(endCreateCompany())} }
                formData={this.props.form}
            />
        }
    }
}