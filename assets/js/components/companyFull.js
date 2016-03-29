"use strict";
import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import {addListEntry, removeListEntry, validateCompany, createResource, addNotification, companyTransaction} from '../actions';
import {reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import DateInput from './forms/dateInput';
import { fieldStyle, fieldHelp, requiredFields, formFieldProps, formProxyable, formProxy } from '../utils';
import PersonsForm from './person'
import ParcelsForm from './parcel'
import ShareClassesForm from './shareClass'
import Address from './forms/address'
import { routeActions } from 'react-router-redux'
import Panel from './panel'

@formProxy
@formProxyable
export class HoldingForm extends React.Component {
    static propTypes = {
        fields: React.PropTypes.object,
        holders: React.PropTypes.object
    };

    subForms = ['parcels', 'holders'];

    render() {
        return <Panel title={this.props.title} remove={this.props.remove} panelType='success'>

                    <div className="col-md-6 parcel-col">
                         <ParcelsForm formKey={this.props.formKey} ref="parcels" title='Parcel'
                            shareClasses={this.props.shareClasses}
                            keyList={this.props.formData.parcels.list || []}
                            remove={(...args)=>this.props.removeListEntry('parcels', ...args) } />

                        <div className="text-center btn-toolbar"><Button bsStyle="success" onClick={
                            () => {this.props.addListEntry('parcels') }
                        }>Add Parcel</Button></div>
                    </div>
                    <div className='col-md-6 person-col'>
                        <PersonsForm formKey={this.props.formKey} ref="holders" descriptor="holders" title='Shareholder'
                        keyList={this.props.formData.holders.list || []} remove={(...args)=>this.props.removeListEntry('holders', ...args) } />
                        <div className="text-center"><Button bsStyle="success"
                            onClick={() => {this.props.addListEntry('holders') }
                        }>Add Holder</Button></div>
                    </div>

                    </Panel>
    }
}

const DecoratedHoldingForm = reduxForm({
  form: 'holding',
  fields: [], //maybe name
  destroyOnUnmount: false
})(HoldingForm)


@formProxy
export class HoldingsForm extends React.Component {
    getKey(d) {
        return  `${this.props.formKey}.holdings.${d}`;
    }
    render() {
        return  <div>
            { this.props.formData.list.map((d, i) => {
                return <DecoratedHoldingForm ref={d} key={d}
                    title={`Allocation #${i+1}`}
                    formKey={this.getKey(d)}
                    formData={this.props.formData[d]}
                    remove={(...args) => this.props.removeListEntry('holdings', d, ...args)}
                    addListEntry={(...args) => this.props.addListEntry('holdings', d, ...args) }
                    removeListEntry={(...args) => this.props.removeListEntry('holdings', d, ...args)}
                    shareClasses={this.props.shareClasses}
                    register={this.register(d)}
                    unregister={this.unregister(d)} />
                })}
        </div>
    }
}



@formProxy
export class HoldingsPage extends React.Component {
    static propTypes = {
        formData: React.PropTypes.object
    };
    subForms = ['holdings']

    render() {
        return <form className="form-horizontal">
                   <fieldset>
                    <legend>Shareholdings</legend>
                    <HoldingsForm ref="holdings"
                    keyList={this.props.formData.list}
                    formKey={this.props.formKey}
                    formData={this.props.formData}
                    addListEntry={this.props.addListEntry}
                    shareClasses={this.props.shareClasses}
                    removeListEntry={this.props.removeListEntry}   />
                    <div className="text-center"><Button bsStyle="success" onClick={
                        () => {this.props.addListEntry('holdings') }
                    }>Add New Shareholding</Button></div>
                </fieldset>
            </form>
    }
}

@formProxy
export class DirectorsPage extends React.Component {
    static propTypes = {
        formData: React.PropTypes.object
    };
    subForms = ['directors']
    render() {
        return <form className="form-horizontal">
                   <fieldset>
                    <legend>Directors</legend>
                    <PersonsForm ref="directors" descriptor="directors" title='Director'
                    keyList={this.props.formData.list}
                    formKey={this.props.formKey}
                    remove={(key) => this.props.removeListEntry('directors', key)} />
                    <div className="text-center"><Button bsStyle="success" onClick={
                        () => {this.props.addListEntry('directors') }
                    }>Add New Director</Button></div>
                </fieldset>
            </form>
    }
};

@formProxy
export class ShareClassesPage extends React.Component {
    static propTypes = {
        formData: React.PropTypes.object
    };
    subForms = ['shareClasses'];
    render() {
        return <form className="form-horizontal">
                   <fieldset>
                    <legend>Share Classes</legend>
                    <ShareClassesForm ref="shareClasses"
                    keyList={this.props.formData.list}
                    formKey={this.props.formKey}
                    remove={(key) => this.props.removeListEntry('shareClasses', key)} />
                    <div className="text-center col-md-6 col-md-offset-3"><Button bsStyle="success" onClick={
                        () => {this.props.addListEntry('shareClasses') }
                    }>Add New Share Class</Button></div>
                </fieldset>
            </form>
    }
}

@formProxyable
@formFieldProps({
    labelClassName: 'col-xs-3',
    wrapperClassName: 'col-xs-9'
})
export class CompanyFieldsForm extends React.Component {
    static propTypes = {
        fields: React.PropTypes.object
    };

    render() {
        return  (
         <form className="form-horizontal">
              <fieldset>
                <legend>Basic Info</legend>
                    <Input type="text" {...this.formFieldProps('companyName')} />
                    <Input type="text" {...this.formFieldProps('nzbn') } />
                    <DateInput {...this.formFieldProps('incorporationDate') }/>
                    <Address {...this.formFieldProps('registeredCompanyAddress') }/>
                    <Address {...this.formFieldProps('addressForService') } />
                </fieldset>
        </form> )
    }
}

const companyFields = ['companyName', 'nzbn', 'incorporationDate', 'addressForService', 'registeredCompanyAddress'];
const DecoratedCompanyFieldsForm = reduxForm({
    form: 'companyFull',
    fields: companyFields,
    validate: requiredFields.bind(null, companyFields),
    asyncValidate: validateCompanyFieldsAsync,
    asyncBlurFields: ['companyName'],
    destroyOnUnmount: false
}/*, {
    state => ({ // mapStateToProps
      initialValues: state.account.data // will pull state into form's initialValues
    }),
}*/)(CompanyFieldsForm);

@formProxy
export class CompanyFieldsPage extends React.Component {
    render() {
        return <DecoratedCompanyFieldsForm formKey={this.props.formKey}
            register={this.register()}
            unregister={this.unregister()}/>
    }
}


function validateCompanyFieldsAsync(data, dispatch){
    return dispatch(validateCompany(data))
        .then((result) => {
            if(result.error){
                return {
                    companyName: [result.response.message]
                }
            }
        })
}



@connect(state => ({formData: (state.form.companyFull || {}).createCompanyModal}))
export default class CreateCompanyModal extends React.Component {

    pages = [
        function(){
        return  <CompanyFieldsPage ref="form" formKey={this.props.formKey} />
        },
        function(){
            return  <DirectorsPage ref="form" formKey={this.props.formKey}
                addListEntry={(...args) => {this.props.dispatch(addListEntry(this.props.formName, this.props.formKey,  ...args))}}
                removeListEntry={(...args) => {this.props.dispatch(removeListEntry(this.props.formName, this.props.formKey, ...args))}}
                formData={this.props.formData.directors} />
        },
        function(){
            return  <ShareClassesPage ref="form" formKey={this.props.formKey}
                addListEntry={(...args) => {this.props.dispatch(addListEntry(this.props.formName, this.props.formKey,  ...args))}}
                removeListEntry={(...args) => {this.props.dispatch(removeListEntry(this.props.formName, this.props.formKey, ...args))}}
                formData={this.props.formData.shareClasses} />
        },
        function(){
            // you can get shareClass etc from formData
            return  <HoldingsPage ref="form" formKey={this.props.formKey}
                addListEntry={(...args) => {this.props.dispatch(addListEntry(this.props.formName, this.props.formKey, ...args))}}
                removeListEntry={(...args) => {this.props.dispatch(removeListEntry(this.props.formName, this.props.formKey, ...args))}}
                shareClasses={this.props.formValues.shareClasses}
                formData={this.props.formData.holdings} />
        },

    ];

    handleNext() {
        this.refs.form.touchAll();
        if(this.refs.form.isValid()){
            if(this.props.index < this.pages.length -1){
                this.props.next();
            }
            else{
                let companyId;
                this.props.dispatch(createResource('/company', this.props.formValues))
                    .then((action) => {
                        companyId = action.response.id;
                        // quick hack for today,
                        let values = this.props.formValues;
                        values = {...values, directors: values.directors.map(x => ({person: x}) )};
                        return this.props.dispatch(companyTransaction('seed',companyId, values))
                    })
                    .then((action) => this.props.dispatch(routeActions.push('/company/view/'+companyId)))
                    .then(() => this.props.dispatch(addNotification({message: 'Company Created'})))
                    .then(() => this.props.end())
            }
        }
    };
    componentWillUnmount() {
        this.refs.modal._onHide();
    }
    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Create a new Company</Modal.Title>
              </Modal.Header>

              <Modal.Body>
                { this.pages[this.props.index].call(this) }
              </Modal.Body>

              <Modal.Footer>
                <Button onClick={this.props.end} >Close</Button>
                { this.props.index > 0 && <Button onClick={this.props.previous} bsStyle="primary">Previous</Button> }
                 <Button onClick={::this.handleNext} bsStyle="primary">{ this.props.index < this.pages.length -1 ? 'Next' : 'Submit' }</Button>
              </Modal.Footer>
            </Modal>
    }
}
