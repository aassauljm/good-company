"use strict";
import React, {PropTypes} from 'react';
import { connect } from 'react-redux';
import { pureRender, numberWithCommas, stringToDate, fieldStyle, fieldHelp } from '../utils';
import Button from './forms/buttonInput';
import STRINGS from '../strings';
import { Link } from 'react-router';
import TRANSFER from './schemas/transfer.json'
import { reduxForm } from 'redux-form';
import Input from './forms/input';
import DateInput from './forms/dateInput';

function componentType(fieldProps){
    return fieldProps['x-hints'] && fieldProps['x-hints']["form"] && fieldProps['x-hints']["form"]["inputComponent"]
}

function renderList(fieldProps, componentProps){
    return <div>
        { componentProps.map((c, i) => {
            return <div key={i}>{ renderFormSet(fieldProps, c) } </div>;
        }) }
             <div className="button-row">
                <Button onClick={() => componentProps.addField({})} >Add Item</Button>
            </div>
        </div>
    }



function renderField(fieldProps, componentProps){
    if(fieldProps.type === 'string'){
        if(componentType(fieldProps) === 'date'){
            return <DateInput {...componentProps} bsStyle={fieldStyle(componentProps)} hasFeedback={true} help={fieldHelp(componentProps)} label={fieldProps.title}/>
        }
        return <Input type="text" {...componentProps} bsStyle={fieldStyle(componentProps)} hasFeedback={true} help={fieldHelp(componentProps)} label={fieldProps.title}/>
    }
    if(fieldProps.type === 'number'){
        return <Input type="number" {...componentProps} bsStyle={fieldStyle(componentProps)} hasFeedback={true} help={fieldHelp(componentProps)} label={fieldProps.title}/>
    }
    if(fieldProps.enum){
        return <Input type="select"  {...componentProps} bsStyle={fieldStyle(componentProps)} hasFeedback={true} help={fieldHelp(componentProps)} label={fieldProps.title}>
            { fieldProps.enum.map((f, i) => {
                return <option key={i} value={f}>{fieldProps.enumNames[i]}</option>
            })}
        </Input>
    }
    if(fieldProps.type === 'array'){
        return renderList(fieldProps.items.properties, componentProps);
    }

    if(fieldProps.type === 'object'){
        return renderFormSet(fieldProps.properties, componentProps)
    }
}

function renderFormSet(schemaProps, fields){
    return <fieldset>
        { Object.keys(schemaProps).map((key, i) => {
            return <div key={i}>{renderField(schemaProps[key], fields[key])}</div>
        }) }
    </fieldset>
}


export  class RenderForm extends React.Component {
    render() {
        const { fields, schema } = this.props;
        return <form>
            <h4>{ schema.title }</h4>
           { schema.description && <h5>{ schema.description }</h5>}
           { renderFormSet(schema.properties, fields) }
            <div className="button-row">
                <Button onClick={this.submit} bsStyle="primary" disabled={!this.props.valid}>Generate</Button>
            </div>
        </form>
    }

}


function getFields(schema) {
    const fields = [];
    function loop(props, path){
        Object.keys(props).map(key => {
            if(props[key].type === 'object'){
                loop(props[key].properties, path+key+'.')
            }
            else if(props[key].type === 'array'){
                if(props[key].items.type === "object"){
                    loop(props[key].items.properties, path+key+'[].');
                }
                else{
                    fields.push(path+ key+'[]');
                }
            }
            else{
                fields.push(path+ key);
            }
        });
    }
    loop(schema.properties, '');
    return fields;
}

function getValidate(schema){
    return (values) => {
        function loop(props, values, required){
            return Object.keys(props).reduce((acc, key) => {
                if(props[key].type === 'object'){
                    acc[key] = loop(props[key].properties, values[key], props[key].required || [])
                }
                if(required.indexOf(key) >= 0 && (!values || values[key] === undefined || values[key] === null)){
                    acc[key] = ['Required.']
                }
                return acc;
            }, {})
        }
        const errors = loop(schema.properties, values, schema.required || []);
        return errors;
    }
}

@reduxForm({
  form: 'transferTemplate',
  fields: getFields(TRANSFER),
  validate: getValidate(TRANSFER)
})
export  class TransferForm extends React.Component {

    render() {
        const { fields } = this.props;
        return <RenderForm schema={TRANSFER}  {...this.props}/>
    }
}


const TemplateMap = {
    'transfer': TransferForm
}



@pureRender
export  class TemplateView extends React.Component {
    renderBody() {
        switch(this.props.params.name){
            case 'transfer':
                return <TransferForm initialValues={{transaction: {transferors: [{}], transferees: [{}]}}}/>
            default:
            return <div>Not Found</div>
        }
    }
    render() {
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                { this.renderBody() }
            </div>
            </div>
    }
}


@pureRender
export default class TemplateList extends React.Component {
    static propTypes = {
        companyState: PropTypes.object
    };

    renderBody() {
        const id = this.props.companyId;
        return <div className="row">
            <Link to={`/company/view/${id}/templates/transfer`} className="actionable select-button" >
                    <span className="glyphicon glyphicon-transfer"></span>
                    <span className="transaction-button-text">Transfer Shares</span>
            </Link>
        </div>

    }

    render() {
        const current = this.props.companyState;
        return <div className="container icon-action-page">
            <div className="widget">
                <div className="widget-header">
                    <div className="widget-title">
                        Templates
                    </div>
                </div>
                <div className="widget-body">
                    { this.props.children ? this.props.children : this.renderBody() }
                </div>
                </div>
            </div>
    }
}


