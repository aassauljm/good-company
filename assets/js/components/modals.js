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

// WARNING, REFHACKS needs to be removed and worked around, somehow


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

export class HoldingForm extends React.Component {
    static propTypes = {
        fields: React.PropTypes.object
    };

    componentWillMount(nextProps) {
        this.props.register(this);
    };

    render() {
        const labelClassName = 'col-xs-3', wrapperClassName = 'col-xs-8';
        const { fields: {name, address } } = this.props;
        return <div className="panel panel-default">
                <div className="panel-heading">
                    { this.props.title }
                    <Button className="pull-right" bsSize='xs' aria-label="Close" onClick={this.props.remove}><span aria-hidden="true">&times;</span></Button>
                </div>
                <div className="panel-body">
                    Hi
                </div>
            </div>

    }
}

const DecoratedHoldingForm = reduxForm({
  form: 'holding',
  fields: [],
  destroyOnUnmount: false
})(HoldingForm)


export class HoldingsPage extends React.Component {
    static propTypes = {
        formData: React.PropTypes.object
    };

    REFHACK = {};

    getKey(d) {
        return `${this.props.formKey}.holdings[${d}]`;
    }

    touchAll() {
        this.props.holdingKeys.map((d, i) => {
            this.REFHACK[d].props.touchAll();
        });
    }

    isValid() {
        return  this.props.holdingKeys.map((d, i) => {
            return this.REFHACK[d].props.valid;
        }).every(x => x)
    }

    render() {
        return <form className="form-horizontal">
                   <fieldset>
                    <legend>Shareholdings</legend>
                        { this.props.holdingKeys.map((d, i) => {
                            this.REFHACK[d] = this.REFHACK[d] || {};
                            return <DecoratedHoldingForm ref={d} key={d} title={`Allocation #${i+1}`} formKey={this.getKey(d)}
                            remove={() => this.props.removeListEntry('holdings', d)}
                            register={(child) => this.REFHACK[d] = child} />
                        })}
                    <div className="text-center"><Button bsStyle="success" onClick={
                        () => {this.props.addListEntry('holdings') }
                    }>Add New Shareholding</Button></div>
                </fieldset>
            </form>
    }
}

export class PersonForm extends React.Component {
    static propTypes = {
        fields: React.PropTypes.object
    };

    componentWillMount(nextProps) {
        this.props.register(this);
    };

    render() {
        const labelClassName = 'col-xs-3', wrapperClassName = 'col-xs-8';
        const { fields: {name, address } } = this.props;
        return <div className="panel panel-default">
            <div className="panel-heading">
                { this.props.title }
                <Button className="pull-right" bsSize='xs' aria-label="Close" onClick={this.props.remove}><span aria-hidden="true">&times;</span></Button>
            </div>
            <div className="panel-body">
                <Input type="text" {...name} label={STRINGS['name']} bsStyle={fieldStyle(name)} labelClassName={labelClassName} wrapperClassName={wrapperClassName}  />
                <Address type="text"  {...address}  label={STRINGS['address']} bsStyle={fieldStyle(address)} labelClassName={labelClassName} wrapperClassName={wrapperClassName}/>
                </div>
            </div>

    }
}

const DecoratedPersonForm = reduxForm({
  form: 'person',
  fields: ['name', 'address'],
  validate: requiredFields.bind(this, ['name', 'address']),
  destroyOnUnmount: false
})(PersonForm)


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
            this.REFHACK[d].props.touchAll();
        });
    }

    isValid() {
        return  this.props.directorKeys.map((d, i) => {
            return this.REFHACK[d].props.valid;
        }).every(x => x)
    }

    render() {
        return <form className="form-horizontal">
                   <fieldset>
                    <legend>Directors</legend>
                        { this.props.directorKeys.map((d, i) => {
                            this.REFHACK[d] = {};
                            return <DecoratedPersonForm ref={d} key={d} formKey={this.getKey(d)} title='Director'
                                remove={(key) => this.props.removeListEntry('directors', d)}
                                register={(child) => this.REFHACK[d] = child}
                                />
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
        this.props.register(this);
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
    REFHACK;

    touchAll() {
        this.REFHACK.props.touchAll()
    }

    isValid(){
        return this.REFHACK.props.valid;
    }

    render() {
        return <DecoratedCompanyFieldsForm formKey={this.props.formKey} register={(child) => this.REFHACK = child} />
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
            const holdingKeys = this.props.formData.holdings.list;
            return  <HoldingsPage ref="form" formKey='createCompanyModal'
                addListEntry={(listType) => {this.props.dispatch(addListEntry('createCompany', 'createCompanyModal', listType))}}
                removeListEntry={(listType, key) => {this.props.dispatch(removeListEntry('createCompany', 'createCompanyModal', listType, key))}}
                holdingKeys={holdingKeys} />
        },
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