"use strict";
import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import {nextModal, previousModal, endCreateCompany, addListEntry, removeListEntry} from '../actions';
import {reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import DatePicker from 'react-date-picker';
import { fieldStyle, requiredFields } from '../utils';

//import bindActionData from 'redux-form/lib/bindActionData';
//import {touch} from 'redux-form/lib/actions';
//import readFields from 'redux-form/lib/readFields';



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

    componentWillMount(nextProps) {
        this.props.REFHACK.form = this;
    };

    render() {
        const labelClassName = 'col-xs-3', wrapperClassName = 'col-xs-8';
        const { fields: {name, address } } = this.props;
        return <div className="panel panel-default">
            <div className="panel-heading">Director
                <Button className="pull-right" bsSize='xs' aria-label="Close" onClick={() => this.props.remove('directors', this.props.listKey)}><span aria-hidden="true">&times;</span></Button>
            </div>
            <div className="panel-body">
                <Input type="text" {...name} label={STRINGS['name']} bsStyle={fieldStyle(name)} labelClassName={labelClassName} wrapperClassName={wrapperClassName}  />
                <Address type="text"  {...address}  label={STRINGS['address']} bsStyle={fieldStyle(address)} labelClassName={labelClassName} wrapperClassName={wrapperClassName}/>
                </div>
            </div>

    }
}

const DecoratedDirectorForm = reduxForm({
  form: 'director',
  fields: ['name', 'address'],
  validate: requiredFields.bind(this, ['name', 'address']),
  destroyOnUnmount: false
})(DirectorForm)


export class DirectorsPage extends React.Component {
    static propTypes = {
        formData: React.PropTypes.object
    };

    REFHACK = {};

    getKey(d) {
        return `${this.props.formKey}.directors[${d}]`;
    }

    touchAll() {
        this.props.directorKeys.map((d, i) => {
            this.REFHACK[d].form.props.touchAll();
        });
    }

    isValid() {
        return  this.props.directorKeys.map((d, i) => {
            return this.REFHACK[d].form.props.valid;
        }).every(x => x)
    }

    render() {
        return <form className="form-horizontal">
                   <fieldset>
                    <legend>Directors</legend>
                        { this.props.directorKeys.map((d, i) => {
                            this.REFHACK[d] = {};
                            return <DecoratedDirectorForm ref={d} key={d} listKey={d} formKey={this.getKey(d)} remove={this.props.removeListEntry} REFHACK={this.REFHACK[d]} />
                        })}
                    <div className="text-center"><Button bsStyle="success" onClick={
                        () => {this.props.addListEntry('directors') }
                    }>Add New Director</Button></div>
                </fieldset>
            </form>
    }
}



export class CompanyFieldsForm extends React.Component {
    static propTypes = {
        fields: React.PropTypes.object
    };

    componentWillMount(nextProps) {
        this.props.REFHACK.form = this;
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

export class CompanyFieldsPage extends React.Component {
    constructor(props) {
        super(props);
        this.REFHACK = {};
    }

    touchAll() {
        this.REFHACK.form.props.touchAll()
    }

    isValid(){
        return this.REFHACK.form.props.valid;
    }

    render() {
        return <DecoratedCompanyFieldsForm REFHACK={this.REFHACK} formKey={this.props.formKey}  />
    }
}


const companyFields = ['companyName', 'nzbn', 'incorporationDate', 'addressForService', 'registeredCompanyAddress'];
const DecoratedCompanyFieldsForm = reduxForm({
    form: 'companyFull',
    fields: companyFields,
    validate: requiredFields.bind(null, companyFields),
    destroyOnUnmount: false
})(CompanyFieldsForm);


@connect(state => ({formData: (state.form.companyFull || {}).createCompanyModal }))
export class CreateCompanyModal extends React.Component {



    pages = [
        function(){
            const directorKeys = this.props.formData.directors.list;
            return  <DirectorsPage ref="form" formKey='createCompanyModal'
                addListEntry={(listType) => {this.props.dispatch(addListEntry('createCompany', 'createCompanyModal', listType))}}
                removeListEntry={(listType, key) => {this.props.dispatch(removeListEntry('createCompany', 'createCompanyModal', listType, key))}}
                directorKeys={directorKeys} />
        },
        function(){
            return  <CompanyFieldsPage ref="form" formKey={'createCompanyModal'} />
        },

    ];

    handleNext() {
        this.refs.form.touchAll();
        if(this.refs.form.isValid()){
            this.props.next();
        }
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
                { this.props.index > 0 &&    <Button onClick={this.props.previous} bsStyle="primary">Previous</Button> }
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
                next={() => {this.props.dispatch(nextModal('createCompany'))} }
                previous={() => {this.props.dispatch(previousModal('createCompany'))} }
                end={() => {this.props.dispatch(endCreateCompany())} }
            />
        }
    }
}