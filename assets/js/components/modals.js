"use strict";
import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import {nextModal, previousModal, endCreateCompany, addListEntry, removeListEntry, validateCompany, createResource, addNotification} from '../actions';
import {reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import DatePicker from 'react-date-picker';
import { fieldStyle, requiredFields, formProxyable, formProxy } from '../utils';
import PersonsForm from './person'
import ParcelsForm from './parcel'
import ShareClassesForm from './shareClass'
import Address from './forms/address'
import { pushState } from 'redux-router';

export class DateInput extends React.Component {

    render() {
         return <Input {...this.props} >
                    <DatePicker {...this.props}  />
          </Input>
    }
}

@formProxy
@formProxyable
export class HoldingForm extends React.Component {
    static propTypes = {
        fields: React.PropTypes.object,
        holders: React.PropTypes.object
    };

    subForms = ['parcels', 'holders'];

    render() {
        return <div className="panel panel-primary">
                <div className="panel-heading">
                    { this.props.title }
                    <Button className="pull-right" bsSize='xs' aria-label="Close" onClick={() => this.props.remove()}><span aria-hidden="true">&times;</span></Button>
                </div>
                <div className="panel-body">
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
                        <PersonsForm formKey={this.props.formKey} ref="holders" descriptor="holders" title='Shareholder' keyList={this.props.formData.holders.list || []} remove={(...args)=>this.props.removeListEntry('holders', ...args) } />
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
}



const companyFields = ['companyName', 'nzbn', 'incorporationDate', 'addressForService', 'registeredCompanyAddress'];
const DecoratedCompanyFieldsForm = reduxForm({
    form: 'companyFull',
    fields: companyFields,
    validate: requiredFields.bind(null, companyFields),
    asyncValidate: validateCompanyFieldsAsync,
    asyncBlurFields: ['companyName', 'companyNumber'],
    destroyOnUnmount: false
}/*, {
    state => ({ // mapStateToProps
      initialValues: state.account.data // will pull state into form's initialValues
    }),
}*/)(CompanyFieldsForm);



@connect(state => ({formData: (state.form.companyFull || {}).createCompanyModal}))
export class CreateCompanyModal extends React.Component {

    pages = [
        /*function(){
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
        },*/
        function(){
            return  <CompanyFieldsPage ref="form" formKey={this.props.formKey} />
        },
       /* function(){
            return  <DirectorsPage ref="form" formKey={this.props.formKey}
                addListEntry={(...args) => {this.props.dispatch(addListEntry(this.props.formName, this.props.formKey,  ...args))}}
                removeListEntry={(...args) => {this.props.dispatch(removeListEntry(this.props.formName, this.props.formKey, ...args))}}
                formData={this.props.formData.directors} />
        },*/

    ];

    handleNext() {
        this.refs.form.touchAll();
        if(this.refs.form.isValid()){
            if(this.props.index < this.pages.length -1){
                this.props.next();
            }
            else{
                this.props.dispatch(createResource('/company', this.props.formValues))
                    .then((action) => this.props.dispatch(pushState(null, '/company/view/'+action.response.id)))
                    .then(() => this.props.dispatch(addNotification({message: 'Company Created'})))
                    .then(() => this.props.end())

            }
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
                { this.props.index > 0 && <Button onClick={this.props.previous} bsStyle="primary">Previous</Button> }
                 <Button onClick={::this.handleNext} bsStyle="primary">{ this.props.index < this.pages.length -1 ? 'Next' : 'Submit' }</Button>
              </Modal.Footer>
            </Modal>
    }
}

@connect(state => ({ form: state.form }))
export class FormReduce extends React.Component {
    getValues() {
        const rootForms = this.props.form;
        function getFormModel(path, index){
            return rootForms[{
                'directors': 'person',
                'holders': 'person',
                'shareClasses': 'shareClass',
                'holdings': 'holding'
            }[path[path.length-1]] || path[path.length-1]] || {}
        }
        const values = (function getValues(formData, path = []){
            if(!formData){
                return {};
            }
            function getDeep(path, id){
                const formModel = getFormModel(path);
                const currentForm = formModel[[...path, id].join('.')]
                return currentForm || {}
            }
            return Object.keys(formData).reduce((acc, key) => {
                if(key[0] === "_"){
                    return acc;
                }
                if(formData[key].list){
                    acc[key] =  formData[key].list.map(id => {
                        return {...getValues(getDeep([...path, key], id)), ...getValues(formData[key][id], [...path, key, id]) }
                    }).filter(x => x.label)
                }
                else{
                    acc[key] = formData[key].value
                }
                return acc;
            }, {});

        })(this.props.form[this.props.formName][this.props.formKey], [this.props.formKey]);
        return values;
    }

    componentWillUnmount() {
        // destroy involved forms, maybe
    }

    render() {
        const formValues = this.getValues();

        return <div>{ React.Children.map(this.props.children, child => {
            return React.cloneElement(child, {formValues: formValues, formName: this.props.formName, formKey: this.props.formKey});
        }) }
    </div>
    }
}


@connect(state => state.modals)
export default class Modals extends React.Component {
    render() {
        if(!this.props.showing){
            return false;
        }
        if(this.props.showing === 'createCompany'){
            return <FormReduce formName="companyFull" formKey="createCompanyModal">
                <CreateCompanyModal index={this.props.createCompany.index}
                next={() => {this.props.dispatch(nextModal('createCompany'))} }
                previous={() => {this.props.dispatch(previousModal('createCompany'))} }
                end={() => {this.props.dispatch(endCreateCompany())} } />
                </FormReduce>
        }
    }
}