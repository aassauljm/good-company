"use strict";
import React, {PropTypes} from 'react';
import { connect } from 'react-redux';
import { pureRender, numberWithCommas, stringDateToFormattedString, fieldStyle, fieldHelp, formatString, companyListToOptions, personList } from '../utils';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Button from './forms/buttonInput';
import STRINGS from '../strings';
import { Link } from 'react-router';
import { reduxForm } from 'redux-form';
import Input from './forms/input';
import DateInput from './forms/dateInput';
import { renderTemplate, showEmailDocument } from '../actions';
import { saveAs } from 'file-saver';
import Shuffle from 'react-shuffle';
import LawBrowserContainer from './lawBrowserContainer';
import LawBrowserLink from './lawBrowserLink';
import templateSchemas from './schemas/templateSchemas';
import { Search } from './search';


function createLawLinks(list){
    return <div>
        { list.map((item, i) => {
            return <LawBrowserLink key={i} {...item.link}>{item.text}</LawBrowserLink>
        })}
    </div>
}

function getIn(obj, fields){
    return fields.reduce((obj, f) => {
        return obj ? obj[f] : null
    }, obj);
}

function componentType(fieldProps){
    return getIn(fieldProps, ['x-hints', "form", "inputComponent"])
}

function oneOfField(fieldProps){
    return getIn(fieldProps, ['x-hints', "form", "selector"])
}

function addItem(fieldProps){
    return getIn(fieldProps, ['x-hints', "form", "addItem"]) || 'Add Item';
}

function inputSelectSource(fieldProps){
    return getIn(fieldProps, ['x-hints', "form", "selectFromSource"]);
}

function inputSourceTitle(fieldProps){
    return getIn(fieldProps, ['x-hints', "form", "inputTitle"]);
}

function inputSource(fieldProps){
    return getIn(fieldProps, ['x-hints', "form", "source"]);
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
        <Shuffle scale={false}>
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
                <Button onClick={() => {
                    componentProps.addField({...((fieldProps.default || [])[0] || {}), _keyIndex: keyIndex++});
                    } } >{ addItem(fieldProps.items) } </Button>
            </div>
        </fieldset>
}

function renderField(fieldProps, componentProps, index){
    let title = fieldProps.enumeratedTitle ? formatString(fieldProps.enumeratedTitle, index+1) : fieldProps.title;


    const props = {
        bsStyle: fieldStyle(componentProps),
        hasFeedback: true,
        help: fieldHelp(componentProps),
        label: title,
        labelClassName: 'col-md-3',
        wrapperClassName: 'col-md-7'
    };


    if (fieldProps.type === 'string') {
        if (componentType(fieldProps) === 'date') {
            return <DateInput {...componentProps} format={"D MMMM YYYY"} {...props} />
        }
        else if (componentType(fieldProps) == 'dateTime') {
            return <DateInput {...componentProps} {...props} time={true} displayFormat={'DD/MM/YYYY hh:mm a'}/>
        }
        else if(componentType(fieldProps) === 'textarea') {
            return <Input type="textarea" rows="5" {...componentProps}  {...props} />
        }
        return <Input type="text" {...componentProps} {...props} />
    } else if (fieldProps.type === 'number'){
        return <Input type="number" {...componentProps} {...props} />
    } else if (fieldProps.enum && fieldProps.enum.length > 1) {
        return (
            <Input type="select"  {...componentProps} {...props}>
                { fieldProps.enum.map((f, i) => {
                    return <option key={i} value={f}>{fieldProps.enumNames ? fieldProps.enumNames[i] : f}</option>
                })}
            </Input>
        );
    }
    else if (fieldProps.type === 'array'){
        return renderList(fieldProps, componentProps);
    }
    else if (fieldProps.type === 'object'){
        return <div>{ renderFormSet(fieldProps.properties, componentProps, fieldProps.oneOf) }</div>
    }
}

function renderFormSet(schemaProps, fields, oneOfs, listIndex) {
    const getMatchingOneOf = (value, key) => {
        return (oneOfs.filter(x => x.properties[key].enum[0] === value)[0] || {}).properties || {};
    }
    let selectKey;
    Object.keys(schemaProps).map((key, i) => {
        if(schemaProps[key].enum){
            selectKey = key;
        }
    });
    return (
        <fieldset>
            { Object.keys(schemaProps).map((key, i) => {
                return <div className="form-row" key={i}>{ renderField(schemaProps[key], fields[key], listIndex) }</div>
            }) }
            { oneOfs && selectKey && fields[selectKey] && renderFormSet(getMatchingOneOf(fields[selectKey].value, selectKey), fields) }
        </fieldset>
    );
}

@injectContext
export class RenderForm extends React.Component {
    constructor(props) {
        super(props);
        this.emailDocument = ::this.emailDocument;
    }

    emailDocument() {
        if (this.props.valid) {
            this.props.emailDocument(this.props.values);
        }
    }

    controls() {
        return (
            <div className="button-row form-controls">
                <Button type="reset" bsStyle="default" onClick={this.props.resetForm}>Reset Form</Button>
                <Button type="submit" bsStyle="primary" >Download Document <Glyphicon glyph='download'/></Button>
                <Button bsStyle="info" disabled={!this.props.valid} onClick={this.emailDocument}>Email Document <Glyphicon glyph='envelope'/></Button>
            </div>
        );
    }

    render() {
        const { fields, schema, handleSubmit, onSubmit } = this.props;

        return (
            <form className="generated-form form-horizontal"  onSubmit={handleSubmit}>
                { this.controls() }
                <h4>{ schema.title }</h4>
                { schema.description && <h5>{ schema.description }</h5>}
                { renderFormSet(schema.properties, fields) }
                { this.props.error && <div className="alert alert-danger">
                    { this.props.error.map((e, i) => <div key={i}> { e } </div>) }
                </div> }
                { this.controls() }
            </form>
        );
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
            else if (props[key].type === 'array'){
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

function injectContext(FormComponent) {
    class Injector extends React.Component {
        render() {
            const fields = injectContext(this.props.schema.properties, this.props.fields, this.props.context);
            return <FormComponent {...this.props} fields={fields} />
        }
    }

    function interceptChangesAndInject(schemaProperties, key, fields, context){
        if (inputSelectSource(schemaProperties) && fields[key]) {
            const source = inputSource(schemaProperties);
            const onChange = fields[key][source].onChange;
            fields[key][source].onChange = (event) => {
                onChange(event);
                const result = context[inputSelectSource(schemaProperties)].find(f => f[source] === event);
                result && Object.keys(result).map(k => {
                    if(k !== source && fields[key][k]){
                        fields[key][k].onChange(result[k]);
                    }
                });
            }
            if(context[inputSelectSource(schemaProperties)]){
                fields[key][source].comboData = context[inputSelectSource(schemaProperties)].map(f => f[source]);
            }
        }
    }

    function injectContext(schemaProperties, fields, context) {
        function loop(schemaProperties, fields) {
            fields && Object.keys(schemaProperties).map(key => {
                if (schemaProperties[key].type === 'object') {
                    loop(schemaProperties[key].properties, fields[key]);
                    if (schemaProperties[key].oneOf) {
                        schemaProperties[key].oneOf.map(oneOf => {
                            loop(oneOf.properties, fields[key]);
                        });
                    }
                } else if (schemaProperties[key].type === 'array') {
                    if (schemaProperties[key].items.type === "object") {
                        fields[key] && fields[key].map(f => {
                            loop(schemaProperties[key].items.properties, f);
                        })
                        fields[key] && fields[key].map((field, index) => {
                            interceptChangesAndInject(schemaProperties[key].items,  index, fields[key], context);
                        });
                        if(schemaProperties[key].items.oneOf) {
                            fields[key].map(f => {
                                let values = Object.keys(f).reduce((acc, k) => { acc[k] = f[k].value; return acc;}, {});
                                let result = oneOfMatchingSchema(schemaProperties[key].items, values);
                                if(result){
                                     loop(result.properties, f);
                                }
                            });
                        }
                    }
                }
                interceptChangesAndInject(schemaProperties[key], key, fields, context)
            });

            return fields;
        }

        return loop(schemaProperties, fields);
    }

    return Injector;
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

// Appears to not be populating default on list items
function getDefaultValues(schema, defaults){
    if(!defaults){
        defaults = {};
    }
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
                fields[key] = obj;
            }
            else if(props[key].type === 'array'){
                if(props[key].items.type === "object"){
                    let obj = fields[key] || [];

                    loop(props[key].items.properties, obj, {...(suppliedDefaults[key] || {}), _keyIndex: keyIndex++});
                    if(props[key].items.oneOf){
                        obj.map(o => props[key].items.oneOf.map(oneOf => {
                            loop(oneOf.properties, o, suppliedDefaults[key] || {});
                        }))
                    }
                    fields[key] = obj;
                }
            }
            if(props[key].oneOf){
                let obj = fields[key] || {};
                props[key].oneOf.map(o => {
                    loop(o.properties, obj, suppliedDefaults[key] || {});
                })
                fields[key]  = obj;
            }
        });
        return fields;
    }
    return loop(schema.properties, fields, defaults);
}


const CreateForm = (schema, name) => {
    @reduxForm({
      form: name,
      fields: getFields(schema),
      validate: getValidate(schema)
    })
    class Form extends React.Component {
        render() {
            const { fields } = this.props;
            return <RenderForm schema={schema}  {...this.props} />
        }
    };
    return Form;
}

export const TemplateMap = Object.keys(templateSchemas).reduce((acc, k) => {
    acc[k] = {
        form: CreateForm(templateSchemas[k], k),
        title: templateSchemas[k].title,
        schema: templateSchemas[k],
        icon: templateSchemas[k]['x-icon'],
        getInitialValues: (values) => getDefaultValues(templateSchemas[k], values),
    }
    return acc;
}, {})


function makeContext(companyState) {
    if(!companyState){
        return {};
    }
    return {
        'company.directors': companyState.directorList.directors.map(d => ({...d, ...d.person})),
        'company.shareholders': personList(companyState)
    }
}

@connect((state, ownProps) => {
    return {...state.resources['renderTemplate']}
}, {
    renderTemplate: (args) => renderTemplate(args),
    showEmailDocument: (args) => showEmailDocument(args)
})
export  class TemplateView extends React.Component {

    constructor(props){
        super(props);
        this.submit = ::this.submit;
        this.emailDocument = ::this.emailDocument;
    }

    buildRenderObject(values) {
        let filename = values.filename || TemplateMap[this.props.params.name].schema.filename;
        return {
            formName: TemplateMap[this.props.params.name].schema.formName,
            values: {...values, filename}
        };
    }

    submit(values) {
        let filename;
        this.props.renderTemplate(this.buildRenderObject(values))
            .then((response) => {
                const disposition = response.response.headers.get('Content-Disposition')
                filename = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition)[1].replace(/"/g, '');
                return response.response.blob()
            })
            .then(blob => {
                saveAs(blob, filename);
            })
    }

    emailDocument(values) {
        this.props.showEmailDocument(this.buildRenderObject(values));
    }

    renderBody() {
        let state = this.props.location.query && this.props.location.query.json && {fileType: 'pdf', ...JSON.parse(this.props.location.query.json)};
        let values;
        if(TemplateMap[this.props.params.name]){
            const template = TemplateMap[this.props.params.name];
            let companyState = {};
            if(this.props.companyState){
                companyState = {company: this.props.companyState || {}, ...this.props.companyState};
            }
            const values = template.getInitialValues(state || companyState)
            return <template.form onSubmit={this.submit} emailDocument={this.emailDocument} initialValues={values} context={makeContext(this.props.companyState)} />
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
                    <span className="transaction-button-text">{TemplateMap[template].title}</span>
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


@pureRender
export class TemplateSelectCompany extends React.Component {

    render() {
        return <LawBrowserContainer>
            <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    Templates
                </div>
            </div>
            <div className="widget-body">
                <div className="row">
                    <div className="col-md-6 col-md-offset-3">
                   <p className="text-center">Please select a company:</p>
                   <Search target={(id) => this.props.params.name ? `/company/view/${id}/templates/${this.props.params.name}` : `/company/view/${id}/templates`}/>
                </div>
                </div>
            </div>
        </div>


        </LawBrowserContainer>
    }
}
