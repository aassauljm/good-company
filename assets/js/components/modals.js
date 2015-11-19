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
import PersonsForm from './person'
import ParcelsForm from './parcel'
import Address from './forms/address'
// WARNING, REFHACKS needs to be removed and worked around, somehow


export class DateInput extends React.Component {

    render() {
         return <Input {...this.props} >
                    <DatePicker {...this.props}  />
          </Input>
    }
}

export class HoldingForm extends React.Component {
    static propTypes = {
        fields: React.PropTypes.object,
        holders: React.PropTypes.object
    };

    componentWillMount(nextProps) {
        this.props.register(this);
    };

    render() {
        return <div className="panel panel-default">
                <div className="panel-heading">
                    { this.props.title }
                    <Button className="pull-right" bsSize='xs' aria-label="Close" onClick={() => this.props.remove()}><span aria-hidden="true">&times;</span></Button>
                </div>
                <div className="panel-body">
                    <div className="col-xs-6">
                         <ParcelsForm formKey={this.props.formKey} ref="form" title='Parcel' keyList={this.props.formData.parcels.list || []} remove={(...args)=>this.props.removeListEntry('parcels', ...args) } />
                        <div className="text-center"><Button bsStyle="success" onClick={
                            () => {this.props.addListEntry('parcels') }
                        }>Add Parcel</Button></div>
                    </div>
                    <div className='col-xs-6'>
                        <PersonsForm formKey={this.props.formKey} ref="form" title='Shareholder' keyList={this.props.formData.holders.list || []} remove={(...args)=>this.props.removeListEntry('holders', ...args) } />
                        <div className="text-center"><Button bsStyle="success"
                            onClick={() => {this.props.addListEntry('holders') }
                        }>Add Holder</Button></div>
                    </div>
                </div>
            </div>
    }
}

const DecoratedHoldingForm = reduxForm({
  form: 'holding',
  fields: [], //maybe name
  destroyOnUnmount: false
})(HoldingForm)



export class HoldingsPage extends React.Component {
    static propTypes = {
        formData: React.PropTypes.object
    };

    REFHACK = {};

    touchAll() {
        this.props.formData.list.map((d, i) => {
            this.REFHACK[d].props.touchAll();
        });
    }

    isValid() {
        return  this.props.formData.list.map((d, i) => {
            return this.REFHACK[d].props.valid;
        }).every(x => x)
    }

    getKey(d) {
        return  `${this.props.formKey}.holdings.${d}`;
    }

    render() {
        return <form className="form-horizontal">
                   <fieldset>
                    <legend>Shareholdings</legend>
                        { this.props.formData.list.map((d, i) => {
                            return <DecoratedHoldingForm ref={d} key={d}
                            title={`Allocation #${i+1}`}
                            formKey={this.getKey(d)}
                            formData={this.props.formData[d]}
                            remove={(...args) => this.props.removeListEntry('holdings', d, ...args)}
                            addListEntry={(...args) => this.props.addListEntry('holdings', d, ...args) }
                            removeListEntry={(...args) => this.props.removeListEntry('holdings', d, ...args)}
                            register={(child) => this.REFHACK[d] = child} />
                        })}
                    <div className="text-center"><Button bsStyle="success" onClick={
                        () => {this.props.addListEntry('holdings') }
                    }>Add New Shareholding</Button></div>
                </fieldset>
            </form>
    }
}


export class DirectorsPage extends React.Component {
    static propTypes = {
        formData: React.PropTypes.object
    };

    touchAll() {
        return this.refs.form.touchAll();
    };

    isValid() {
        return this.refs.form.isValid();
    };

    render() {
        return <form className="form-horizontal">
                   <fieldset>
                    <legend>Directors</legend>
                    <PersonsForm ref="form" title='Director'
                    keyList={this.props.formData.list}
                    formKey={this.props.formKey}
                    remove={(key) => this.props.removeListEntry('directors', key)} />
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
            return  <DirectorsPage ref="form" formKey='createCompanyModal'
                addListEntry={(...args) => {this.props.dispatch(addListEntry('companyFull', 'createCompanyModal',  ...args))}}
                removeListEntry={(...args) => {this.props.dispatch(removeListEntry('companyFull', 'createCompanyModal', ...args))}}
                formData={this.props.formData.directors} />
        },
        function(){
            return  <HoldingsPage ref="form" formKey='createCompanyModal'
                addListEntry={(...args) => {this.props.dispatch(addListEntry('companyFull', 'createCompanyModal', ...args))}}
                removeListEntry={(...args) => {this.props.dispatch(removeListEntry('companyFull', 'createCompanyModal', ...args))}}
                formData={this.props.formData.holdings} />
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