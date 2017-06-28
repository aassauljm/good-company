"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { pureRender, fieldStyle, fieldHelp, formatString, personList, votingShareholderList, holdingsAndHolders, votingShareholderSignatureList, directorSignatureList } from '../utils';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Button from './forms/buttonInput';
import { Link } from 'react-router';
import { reduxForm } from 'redux-form';
import Input from './forms/input';
import DateInput from './forms/dateInput';
import Address from './forms/address';
import { renderTemplate, showEmailDocument, showPreviewDocument, addNotification, showLoading, endLoading } from '../actions';
import { saveAs } from 'file-saver';
import Shuffle from 'react-shuffle';
import LawBrowserContainer from './lawBrowserContainer';
import LawBrowserLink from './lawBrowserLink';
import templateSchemas from './schemas/templateSchemas';
import { Search } from './search';
import { componentType, addItem, injectContext, getValidate, getKey, getFields, setDefaults, fieldDisplayLevel, controlStyle, getIn } from 'json-schemer';
import Raven from 'raven-js';
import Widget from './widget';
import WorkingDayNotice from './forms/workingDays';


function createLawLinks(list){
    return (
        <div>
            { list.map((item, i) => <LawBrowserLink key={i} {...item.link}>{item.text}</LawBrowserLink>) }
        </div>
    );
}

class MoveUpButton extends React.PureComponent{
    render(){
        const { swapFields, index, numItems, forceDisplay } = this.props;
        const disabled = index === 0;

        if (disabled && !forceDisplay) {
            return false;
        }

        return(
            <button type="button" className="btn btn-default" onClick={() => swapFields(index, index - 1)} disabled={disabled}>
                <Glyphicon glyph="arrow-up"/>
            </button>
        );
    }
}

class MoveDownButton extends React.PureComponent{
    render(){
        const { swapFields, index, numItems, forceDisplay } = this.props;
        const disabled = index + 1 === numItems;

        if (disabled && !forceDisplay) {
            return false;
        }

        return (
            <button type="button" className="btn btn-default" onClick={() => swapFields(index, index + 1)} disabled={disabled}>
                <Glyphicon glyph="arrow-down"/>
            </button>
        );
    }
}
class RemoveButton extends React.PureComponent{
    render(){
        const { index, numItems, minItems, forceDisplay, removeField } = this.props;
        const disabled = minItems >= numItems;

        if (disabled && !forceDisplay) {
            return false;
        }

        return (
            <button type="button" className="btn btn-default" onClick={() => removeField(index)} disabled={disabled}>
                <Glyphicon glyph="remove"/>
            </button>
        );
    }
}


function ButtonGroupListItemControls({ componentProps, index, minItems, forceDisplay }){
    return [<MoveUpButton key={0} index={index} swapFields={componentProps.swapFields} forceDisplay={forceDisplay} />,
            <MoveDownButton key={1} index={index} swapFields={componentProps.swapFields} numItems={componentProps.length} forceDisplay={forceDisplay} />,
            <RemoveButton key={2} index={index} removeField={componentProps.removeField} numItems={componentProps.length} minItems={minItems} forceDisplay={forceDisplay} />
        ]
}


function InlineListItemControls(props) {
    return <div className="text-right">
                <div className="btn-group btn-group-sm list-controls visible-sm-inline-block visible-xs-inline-block text-right">
                    { ButtonGroupListItemControls(props) }
                </div>
            </div>
}

function ListItemControls(props) {
    return (
        <div>
            <InlineListItemControls componentProps={props.componentProps} index={props.index} minItems={props.minItems}  />
            <div className="btn-group-vertical btn-group-sm list-controls visible-md-block visible-lg-block" style={{zIndex: 100}}>
                 { ButtonGroupListItemControls(props) }
            </div>
        </div>
    );
}

function renderList(fieldProps, componentProps) {
    return (
        <fieldset className="list">
            { fieldProps.title && <legend>{fieldProps.title}</legend>}

            <Shuffle scale={false}>
                { componentProps.map((c, i) => {
                    const controls = controlStyle(fieldProps.items);
                    const className = controls === 'inline' ? 'list-item-inline' : 'list-item'
                    return (
                        <div className={className} key={c._keyIndex.value || i}>
                            { controls !== 'inline' && <ListItemControls componentProps={componentProps} minItems={fieldProps.minItems || 0} index={i} /> }

                            <div className="list-form-set">
                                { renderFormSet(fieldProps.items.properties, c, fieldProps.items.oneOf, i, null, controls === 'inline' && ButtonGroupListItemControls({componentProps, minItems: fieldProps.minItems || 0, index: i, forceDisplay: true})) }
                            </div>
                        </div>
                    );
                }) }
            </Shuffle>

            <div className="button-row">
                <Button onClick={() => {componentProps.addField({...((fieldProps.default || [])[0] || {}), _keyIndex: getKey()});
                    } } >{ addItem(fieldProps.items) }
                </Button>
            </div>
        </fieldset>
    );
}

class RenderField extends React.PureComponent {
    render(){
        const {fieldProps, componentProps, index, controls, siblings} = this.props;
        if (fieldDisplayLevel(fieldProps) === 'hidden') {
            return false;
        }


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
            const type = componentType(fieldProps);
            if (type === 'date') {
                return <DateInput hasPositionControls={!!controls} {...componentProps} format={"D MMMM YYYY"} {...props} />
            }
            else if (type == 'dateTime') {
                return <DateInput hasPositionControls={!!controls}{...componentProps} {...props} time={true} displayFormat={'DD/MM/YYYY hh:mm a'}  />
            }
            else if (type == 'address') {
                return <Address hasPositionControls={!!controls} {...componentProps} {...props} />
            }
            else if(type === 'textarea') {
                return <Input hasPositionControls={!!controls} type="textarea" rows="5" {...componentProps}  {...props} />
            }
            else if(type === 'workingDayNotice') {
                const settings = getIn(fieldProps, ['x-hints', 'form', 'workingDayNotice']);
                return  <WorkingDayNotice hasPositionControls={!!controls} field={componentProps}  {...props} source={siblings[settings.source].value} format={"D MMMM YYYY"} days={settings.days} />
            }

            return <Input hasPositionControls={!!controls} type="text" {...componentProps} {...props}  buttonAfter={controls}/>
        }
        else if (fieldProps.type === 'number'){
            return <Input hasPositionControls={!!controls} type="number" {...componentProps} {...props}  buttonAfter={controls}/>
        }
        else if (fieldProps.enum && fieldProps.enum.length > 1) {
            return (
                <Input type="select"  {...componentProps} {...props} buttonAfter={controls} hasPositionControls={!!controls}>
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
            return <div>{ renderFormSet(fieldProps.properties, componentProps, fieldProps.oneOf, null, fieldProps.title) }</div>
        }
        return false;
    }
}

function renderFormSet(schemaProps, fields, oneOfs, listIndex, title, controls) {
    const getMatchingOneOf = (value, key) => {
        return (oneOfs.filter(x => x.properties[key].enum[0] === value)[0] || {}).properties || {};
    };
    let selectKey;
    Object.keys(schemaProps).map((key, i) => {
        if(schemaProps[key].enum){
            selectKey = key;
        }
    });
    return (
        <fieldset>
         { title && <legend>{title}</legend>}
            { Object.keys(schemaProps).map((key, i) => {
                return <div className="form-row" key={i}><RenderField fieldProps={schemaProps[key]} componentProps={fields[key]} index={listIndex} controls={controls} siblings={fields}/></div>
            }) }
            { oneOfs && selectKey && fields[selectKey] && renderFormSet(getMatchingOneOf(fields[selectKey].value, selectKey), fields, null, null, ) }
        </fieldset>
    );
}

@injectContext
export class RenderForm extends React.Component {
    constructor(props) {
        super(props);
        this.emailDocument = ::this.emailDocument;
        this.previewDocument = ::this.previewDocument;
    }

    emailDocument() {
        if (this.props.valid) {
            this.props.emailDocument(this.props.values);
        }
    }

    previewDocument() {
        if (this.props.valid) {
            this.props.previewDocument(this.props.values);
        }
    }

    controls() {
        return (
            <div className="button-row form-controls">
                <Button type="reset" bsStyle="default" onClick={this.props.resetForm}>Reset Form</Button>
                <Button type="submit" bsStyle="primary" >Download Document <Glyphicon glyph='download'/></Button>
                <Button bsStyle="info" className="email-document" disabled={!this.props.valid} onClick={this.emailDocument}>Email Document <Glyphicon glyph='envelope'/></Button>
                <Button bsStyle="success" className="preview-document" disabled={!this.props.valid} onClick={this.previewDocument}>Preview <Glyphicon glyph='eye-open'/></Button>
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
                <hr />
                { this.controls() }
            </form>
        );
    }

}

const CreateForm = (schema, name) => {
    @reduxForm({
      form: name,
      fields: getFields(schema),
      validate: getValidate(schema)
    })
    class Form extends React.PureComponent {
        render() {
            const { fields } = this.props;
            return <RenderForm  schema={schema}  {...this.props} />
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
        getInitialValues: (values, context) => setDefaults(templateSchemas[k], context, values)
    }
    return acc;
}, {});


function makeContext(companyState) {
    if (!companyState) {
        return {};
    }

    return {
        'company.constitutionFiled': companyState.constitutionFiled,
        'company.name': companyState.companyName,
        'company.number': companyState.companyNumber,
        'company.directors': companyState.directorList.directors.map(d => ({...d, ...d.person})),
        'company.shareholders': personList(companyState),
        'company.votingShareholders': votingShareholderList(companyState),
        'company.holdingsAndHolders': holdingsAndHolders(companyState),
        'company.shareholdingVotingList': votingShareholderSignatureList(companyState),
        'company.directorSignatureList': directorSignatureList(companyState)
    }
}

function jsonStringToValues(string) {
    try {
        return JSON.parse(string);
    }
    catch(e) {
        return {};
    }
}


@connect((state, ownProps) => {
    return {...state.resources['renderTemplate']}
}, {
    renderTemplate: (args) => renderTemplate(args),
    showEmailDocument: (args) => showEmailDocument(args),
    showPreviewDocument: (args) => showPreviewDocument(args),
    addNotification: (...args) => addNotification(...args),
    showLoading: () => showLoading(),
    endLoading: () => endLoading(),
})
export  class TemplateView extends React.PureComponent {

    constructor(props){
        super(props);
        this.submit = ::this.submit;
        this.emailDocument = ::this.emailDocument;
        this.previewDocument = ::this.previewDocument;
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
        this.props.showLoading();
        this.props.renderTemplate(this.buildRenderObject(values))
            .then((response) => {
                const disposition = response.response.headers.get('Content-Disposition')
                filename = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition)[1].replace(/"/g, '');
                return response.response.blob()
            })
            .then(blob => {
                this.props.endLoading();
                saveAs(blob, filename);
            })
            .catch((e) => {
                this.props.endLoading();
                this.props.addNotification({error: true, message: 'Could not generate document.  An error has been submitted to CataLex on your behalf'});
                Raven.captureMessage('Failed to generate document');
            });
    }

    emailDocument(values) {
        this.props.showEmailDocument(this.buildRenderObject(values));
    }

    previewDocument(values) {
        this.props.showPreviewDocument(this.buildRenderObject(values));
    }

    renderBody() {
        let state = this.props.location.query && this.props.location.query.json && {fileType: 'pdf', ...jsonStringToValues(this.props.location.query.json)};
        if(!this.props.canUpdate){
            return <div className="alert alert-danger">
                    Only users with Update Permissions can create templates for this company.
            </div>
        }
        if (TemplateMap[this.props.params.name]) {
            const template = TemplateMap[this.props.params.name];
            const context = makeContext(this.props.companyState);
            const values = template.getInitialValues(state || {}, context);
            return <template.form onSubmit={this.submit} emailDocument={this.emailDocument} previewDocument={this.previewDocument} initialValues={values} context={context} />
        }

        return <div>Not Found</div>
    }

    render() {
        return (
            <div className="row">
                <div className="col-md-12">
                    { this.renderBody() }
                </div>
            </div>
        );
    }
}

const RenderTemplateList = (props) => {
    const { id } = props;

    return (

        <div>
            { Object.keys(TemplateMap).map((template, i) => {
                const link = id ? `/company/view/${id}/templates/${template}` : `/templates/${template}`;
                return (
                    <div key={i}>
                        <Link to={link} className="actionable select-button">
                            <span className={`glyphicon glyphicon-${TemplateMap[template].icon}`}></span>
                            <span className="transaction-button-text">{TemplateMap[template].title}</span>
                        </Link>
                    </div>
                );
            }) }
        </div>
    );
}

export default class TemplateList extends React.PureComponent {
    static propTypes = {
        companyState: PropTypes.object,
        companyId: PropTypes.string
    };

    renderBody() {
        const id = this.props.companyId;
        if(!this.props.canUpdate){
            return <div className="alert alert-danger">
                    Only users with Update Permissions can create templates for this company.
            </div>
        }
        return (
            <div className="row">
               { this.props.canUpdate && <RenderTemplateList id={id} /> }
            </div>
        );
    }

    renderWidget(title) {
        return <Widget title={title} iconClass='fa fa-file-text-o'>
             { this.props.children ?  React.cloneElement(this.props.children, this.props) : this.renderBody() }
        </Widget>
    }

    render() {
        let title = 'Templates';
        if (this.props.params.name && TemplateMap[this.props.params.name] && TemplateMap[this.props.params.name].schema.lawBrowserLinks) {
            return (
                <LawBrowserContainer lawLinks={createLawLinks(TemplateMap[this.props.params.name].schema.lawBrowserLinks)}>
                    { this.renderWidget(title) }
                </LawBrowserContainer>
            );
        }

        return (
            <div className="container icon-action-page">
                { this.renderWidget(title) }
            </div>
        );
    }
}


export class TemplateWidget extends React.PureComponent {
    static propTypes = {
        companyState: PropTypes.object,
        companyId: PropTypes.string
    };

    render() {
        const id = this.props.companyId;
        return <Widget title="Templates" className="templates-widget" iconClass='fa fa-file-text-o' link={id ? `/companies/${ic}/templates` : `/templates`}>
                    <div className="icon-action-page-sml">
                    <RenderTemplateList />
                    </div>
        </Widget>
    }
}


export class TemplateSelectCompany extends React.PureComponent {
    render() {
        return (
            <LawBrowserContainer>
                <Widget title="Templates" iconClass='fa fa-file-text-o'>
                    <div className="row">
                        <div className="col-md-6 col-md-offset-3">
                            <p className="text-center">Please select a company:</p>
                            <Search target={(id) => this.props.params.name ? `/company/view/${id}/templates/${this.props.params.name}` : `/company/view/${id}/templates`} />
                        </div>
                    </div>
                </Widget>
            </LawBrowserContainer>
        );
    }
}
