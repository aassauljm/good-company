"use strict";
import React, {PropTypes} from 'react';
import { connect } from 'react-redux';
import { pureRender, numberWithCommas, stringToDate, fieldStyle, fieldHelp, formatString } from '../utils';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Button from './forms/buttonInput';
import STRINGS from '../strings';
import { Link } from 'react-router';
import TRANSFER from './schemas/transfer.json';
import SPECIAL_RESOLUTION from './schemas/specialResolution.json';
import ORDINARY_RESOLUTION from './schemas/ordinaryResolution.json';
import { reduxForm } from 'redux-form';
import Input from './forms/input';
import DateInput from './forms/dateInput';
import { renderTemplate } from '../actions';
import { saveAs } from 'file-saver';
import Shuffle from 'react-shuffle';
import LawBrowserContainer from './lawBrowserContainer';
import LawBrowserLink from './lawBrowserLink';


function createLawLinks(list){
    console.log(list)
    return <div>
        { list.map((item, i) => {
            return <LawBrowserLink key={i} {...item.link}>{item.text}</LawBrowserLink>
        })}
    </div>
}

function componentType(fieldProps){
    return fieldProps['x-hints'] && fieldProps['x-hints']["form"] && fieldProps['x-hints']["form"]["inputComponent"]
}

function oneOfField(fieldProps){
    return fieldProps['x-hints'] && fieldProps['x-hints']["form"] && fieldProps['x-hints']["form"]["selector"]
}

function addItem(fieldProps){
    return (fieldProps['x-hints'] && fieldProps['x-hints']["form"] && fieldProps['x-hints']["form"]["addItem"]) || 'Add Item';
}

function oneOfMatchingSchema(fieldProps, values){
    const field = oneOfField(fieldProps);
    if(!field || !fieldProps.oneOf){
        return false;
    }
    return fieldProps.oneOf.filter(f => {
        return f.properties[field].enum[0] === values[field];
    })[0];
}

let keyIndex=0;

function renderList(fieldProps, componentProps){
    return <fieldset className="list">
        { fieldProps.title && <legend>{fieldProps.title}</legend>}
        <Shuffle >
        { componentProps.map((c, i) => {
            return <div className="list-item" key={c._keyIndex.value}>
                          <div className="text-right"><div className="btn-group btn-group-sm list-controls visible-sm-inline-block visible-xs-inline-block text-right">
                    { i > 0  && <button type="button" className="btn btn-default" onClick={() => componentProps.swapFields(i, i - 1) }><Glyphicon glyph="arrow-up" /></button> }
                    { i < componentProps.length - 1  && <button type="button" className="btn btn-default"onClick={() => componentProps.swapFields(i, i + 1) }><Glyphicon glyph="arrow-down" /></button> }
                    <button type="button" className="btn btn-default"onClick={() => componentProps.removeField(i) }><Glyphicon glyph="remove" /></button>
                    </div></div>
                <div className="list-form-set">{ renderFormSet(fieldProps.items.properties, c, fieldProps.items.oneOf, i) }</div>
                 <div className="btn-group-vertical btn-group-sm list-controls visible-md-block visible-lg-block">
                    { i > 0  && <button type="button" className="btn btn-default" onClick={() => componentProps.swapFields(i, i - 1) }><Glyphicon glyph="arrow-up" /></button> }
                    <button type="button" className="btn btn-default"onClick={() => componentProps.removeField(i) }><Glyphicon glyph="remove" /></button>
                    { i < componentProps.length - 1  && <button type="button" className="btn btn-default"onClick={() => componentProps.swapFields(i, i + 1) }><Glyphicon glyph="arrow-down" /></button> }
                </div>
            </div>;
        }) }
        </Shuffle>
             <div className="button-row">
                <Button onClick={() => componentProps.addField({...(fieldProps.items.default||{}), _keyIndex: keyIndex++}) } >{ addItem(fieldProps.items) } </Button>
            </div>
        </fieldset>
}



function renderField(fieldProps, componentProps, index){

    const title = fieldProps.enumeratedTitle ? formatString(fieldProps.enumeratedTitle, index+1) : fieldProps.title;
    const props = {
        bsStyle: fieldStyle(componentProps),
        hasFeedback: true,
        help: fieldHelp(componentProps),
        label: title,
        labelClassName: 'col-md-3',
        wrapperClassName: 'col-md-7'
    };
    if(fieldProps.type === 'string'){
        if(componentType(fieldProps) === 'date'){
            return <DateInput {...componentProps} format={"D MMMM YYYY"} {...props} />
        }
        if(componentType(fieldProps) === 'textarea'){
            return <Input type="textarea" rows="5"{...componentProps}  {...props} />
        }
        return <Input type="text" {...componentProps} {...props} />
    }
    if(fieldProps.type === 'number'){
        return <Input type="number" {...componentProps} {...props} />
    }
    if(fieldProps.enum && fieldProps.enum.length > 1){
        return <Input type="select"  {...componentProps} {...props}>
            { fieldProps.enum.map((f, i) => {
                return <option key={i} value={f}>{fieldProps.enumNames ? fieldProps.enumNames[i] : f}</option>
            })}
        </Input>
    }
    if(fieldProps.type === 'array'){
        return renderList(fieldProps, componentProps);
    }

    if(fieldProps.type === 'object'){
        return <div>
            { renderFormSet(fieldProps.properties, componentProps, fieldProps.oneOf) }
        </div>
    }
}




function renderFormSet(schemaProps, fields, oneOfs, listIndex){
    const getMatchingOneOf = (value, key) => {
        return (oneOfs.filter(x => x.properties[key].enum[0] === value)[0] || {}).properties || {};
    }
    let selectKey;
    Object.keys(schemaProps).map((key, i) => {
        if(schemaProps[key].enum){
            selectKey = key;
        }
    });
    return <fieldset>
        { Object.keys(schemaProps).map((key, i) => {
            return <div key={i}>
            <div className="form-row">{ renderField(schemaProps[key], fields[key], listIndex) }</div>
                { oneOfs && selectKey && fields[selectKey] && renderFormSet(getMatchingOneOf(fields[selectKey].value, selectKey), fields) }
            </div>
        }) }

    </fieldset>
}


export  class RenderForm extends React.Component {
    controls() {
        return <div className="button-row form-controls">
                <Button type="reset" bsStyle="default" onClick={this.props.resetForm}>Reset Form</Button>
                <Button type="submit" bsStyle="primary" >Generate Document <Glyphicon glyph='download'/></Button>
            </div>
    }
    render() {
        const { fields, schema, handleSubmit, onSubmit } = this.props;

        return <form className="generated-form form-horizontal"  onSubmit={handleSubmit}>
            { this.controls() }
            <h4>{ schema.title }</h4>
           { schema.description && <h5>{ schema.description }</h5>}
           { renderFormSet(schema.properties, fields) }
            { this.props.error && <div className="alert alert-danger">
                { this.props.error.map((e, i) => <span key={i}> { e } </span>) }
            </div> }
             { this.controls() }
        </form>
    }

}


function getFields(schema) {
    const fields = [];
    function loop(props, path){
        Object.keys(props).map(key => {
            if(props[key].type === 'object'){
                loop(props[key].properties, path + key + '.');
                if(props[key].oneOf){
                    props[key].oneOf.map(oneOf => {
                        loop(oneOf.properties, path+key + '.');
                    });
                }
            }
            else if(props[key].type === 'array'){
                fields.push(path + key + '[]._keyIndex');
                if(props[key].items.type === "object"){
                    loop(props[key].items.properties, path+key + '[].');
                    if(props[key].items.oneOf){
                        props[key].items.oneOf.map(oneOf => {
                            loop(oneOf.properties, path+key + '[].');
                        })
                    }
                }
                else{
                    fields.push(path + key + '[]');
                }
            }
            else{
                fields.push(path + key);
            }
        });
    }
    loop(schema.properties, '');
    return fields;
}

function getValidate(schema){
    return (values) => {
        let globalErrors = [];
        function loop(props, values, required){
            return Object.keys(props).reduce((acc, key) => {
                if(props[key].type === 'object'){
                    const matching = oneOfMatchingSchema(props[key], values[key]);
                    let required = props[key].required || [];
                    let properties = props[key].properties
                    if(matching && matching.required){
                        required = required.concat(matching.required);
                    }
                    if(matching && matching.properties){
                        properties = {...properties, ...matching.properties}
                    }
                    acc[key] = loop(properties, values[key], required)
                }
                if(props[key].type === 'array'){
                    acc[key] = values[key].map(v => {
                        let required = props[key].items.required || [];
                        const matching = oneOfMatchingSchema(props[key].items, v);
                        let properties = props[key].items.properties
                        if(matching && matching.required){
                            required = required.concat(matching.required);
                        }
                        if(matching && matching.properties){
                            properties = {...properties, ...matching.properties}
                        }
                        return loop(properties, v,  required);
                    });
                    if(props[key].minItems && (!values[key] || values[key].length < props[key].minItems)){
                        globalErrors.push([`At least ${props[key].minItems} '${props[key].title}' required.`]);
                    }
                }
                if(required.indexOf(key) >= 0 && (!values || values[key] === undefined || values[key] === null || values[key] === '')){
                    acc[key] = ['Required.']
                }
                return acc;
            }, {})
        }
        const errors = loop(schema.properties, values, schema.required || []);
        if(globalErrors.length){
            errors._error = globalErrors;
        }
        return errors;
    }
}

function getDefaultValues(schema, defaults = {}){
    const fields = {};
    function loop(props, fields, suppliedDefaults){
        Object.keys(props).map(key => {
            if(suppliedDefaults[key]){
                fields[key] = suppliedDefaults[key];
            }
            else if(props[key].default){
                fields[key] = props[key].default;
            }

            if(props[key].type === 'object'){
                let obj = fields[key] || {};
                loop(props[key].properties, obj, suppliedDefaults[key] || {});
            }
            else if(props[key].type === 'array'){
                if(props[key].items.type === "object"){
                    let obj = fields[key] || [];
                    loop(props[key].items.properties, obj, {...(suppliedDefaults[key] || {}), _keyIndex: keyIndex++});
                }
            }
        });
        return fields;
    }
    return loop(schema.properties, fields, defaults);
}


@reduxForm({
  form: 'transferTemplate',
  fields: getFields(TRANSFER),
  validate: getValidate(TRANSFER)
})
export  class TransferForm extends React.Component {
    render() {
        const { fields } = this.props;
        return <RenderForm schema={TRANSFER}  {...this.props} />
    }
}


@reduxForm({
  form: 'specialResolutionTemplate',
  fields: getFields(SPECIAL_RESOLUTION),
  validate: getValidate(SPECIAL_RESOLUTION)
})
export class SpecialResolutionForm extends React.Component {
    render() {
        const { fields } = this.props;
        return <RenderForm schema={SPECIAL_RESOLUTION}  {...this.props} />
    }
}

@reduxForm({
  form: 'ordinaryResolutionTemplate',
  fields: getFields(ORDINARY_RESOLUTION),
  validate: getValidate(ORDINARY_RESOLUTION)
})
export class OrdinaryResolutionForm extends React.Component {
    render() {
        const { fields } = this.props;
        return <RenderForm schema={ORDINARY_RESOLUTION}  {...this.props} />
    }
}


const TemplateMap = {
    'transfer': {
        form: TransferForm,
        schema: TRANSFER,
        getInitialValues: (values) => getDefaultValues(TRANSFER, values),
        icon: 'transfer'
    },
    'special_resolution': {
        form: SpecialResolutionForm,
        schema: SPECIAL_RESOLUTION,
        getInitialValues: (values) => getDefaultValues(SPECIAL_RESOLUTION, values),
        icon: 'list'
    },
    'ordinary_resolution': {
        form: OrdinaryResolutionForm,
        schema: ORDINARY_RESOLUTION,
        getInitialValues: (values) => getDefaultValues(ORDINARY_RESOLUTION, values),
        icon: 'list'
    }
}



@connect((state, ownProps) => {
    return {...state.resources['renderTemplate']}
}, {
    renderTemplate: (args) => renderTemplate(args)
})
export  class TemplateView extends React.Component {

    constructor(props){
        super(props);
        this.submit = ::this.submit;
    }

    submit(values) {
        let filename = TemplateMap[this.props.params.name].schema.filename;
        this.props.renderTemplate({formName: TemplateMap[this.props.params.name].schema.filename, values: {...values, filename: filename}})
            .then((response) => {
                const disposition = response.response.headers.get('Content-Disposition')
                filename = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition)[1].replace(/"/g, '');
                return response.response.blob()
            })
            .then(blob => {
                saveAs(blob, filename);
            })
    }

    renderBody() {
        let state = this.props.location.query && this.props.location.query.json && {fileType: 'pdf', ...JSON.parse(this.props.location.query.json)};
        let values;
        if(TemplateMap[this.props.params.name]){
            const template = TemplateMap[this.props.params.name];
            const values = template.getInitialValues(state || {company: this.props.companyState || {}})
            return <template.form onSubmit={this.submit} initialValues={values} />
        }
        return <div>Not Found</div>
    }

    render() {
        return <div className="row">
            <div className="col-md-12">
                { this.renderBody() }
            </div>
        </div>
    }
}

const RenderTemplateList = (props) => {
    const {id} = props;
    return <div>
            { Object.keys(TemplateMap).map((template, i) => {
                return <div key={i}><Link to={id ? `/company/view/${id}/templates/${template}` : `/templates/${template}`} className="actionable select-button" >
                    <span className={`glyphicon glyphicon-${TemplateMap[template].icon}`}></span>
                    <span className="transaction-button-text">{TemplateMap[template].schema.title}</span>
                </Link></div>
            }) }
            </div>
}

@pureRender
export default class TemplateList extends React.Component {
    static propTypes = {
        companyState: PropTypes.object,
        companyId: PropTypes.string
    };

    renderBody() {
        const id = this.props.companyId;
        return <div className="row">
           <RenderTemplateList id={id}/>
        </div>

    }

    renderWidget(title) {
        return  <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    { title }
                </div>
            </div>
            <div className="widget-body">
                { this.props.children ?  React.cloneElement(this.props.children, this.props) : this.renderBody() }
            </div>
        </div>

    }

    render() {
        const current = this.props.companyState;
        let title = 'Templates'
        if(this.props.params.name && TemplateMap[this.props.params.name] && TemplateMap[this.props.params.name].schema.lawBrowserLinks){
            return <LawBrowserContainer lawLinks={createLawLinks(TemplateMap[this.props.params.name].schema.lawBrowserLinks)}>
                { this.renderWidget(title) }
            </LawBrowserContainer>
        }

        return <div className="container icon-action-page">
                { this.renderWidget(title) }
            </div>
    }
}




@pureRender
export class TemplateWidget extends React.Component {
    static propTypes = {
        companyState: PropTypes.object,
        companyId: PropTypes.string
    };

    render() {
        const current = this.props.companyState;
        const id = this.props.companyId;
        return  <div className="widget">
                <div className="widget-header">
                    <div className="widget-title">
                        <span className="fa fa-file-text-o"/>  Templates
                    </div>
                    <div className="widget-control">
                     <Link to={id ? `/companies/${id}/templates` : `/templates`} >View All</Link>
                    </div>
                </div>
                <div className="widget-body">
                    <div className="icon-action-page-sml">
                    <RenderTemplateList />
                    </div>
                </div>
                </div>
    }
}
