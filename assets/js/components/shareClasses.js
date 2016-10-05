"use strict";
import React, {PropTypes} from 'react';
import Modal from './forms/modal';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from './forms/buttonInput';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { reduxForm } from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { fieldStyle, fieldHelp, formFieldProps, requireFields, renderDocumentLinks, pureRender } from '../utils';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { createResource, updateResource, addNotification } from '../actions';
import DropZone from 'react-dropzone';
import StaticField from './forms/staticField';
import { push } from 'react-router-redux';
import FormData from 'form-data';
import LawBrowserLink from './lawBrowserLink';
import Combobox   from 'react-widgets/lib/Combobox';



const defaultShareClass = '___default';

const shareClassFields = [
    "name",
    "votingRights.1(a)",
    "votingRights.1(b)",
    "votingRights.1(c)",
    "rights[]",
    "limitations[]",
    "transferRestriction",
    "transferRestrictionDocument",
    "documents"
];

const transferRestrictionDocumentLocations = [
    "The company's registered office",
    "The company's address for service",
    "The document is stored electronically within Good Companies"
]

const SelectBoolean = (props) => {
    return <Input type="select" {...props} value={props.value ? 'true' : 'false'} onChange={e => {props.onChange(e.target.value === 'true');  }} onBlur={ () => props.onBlur(props.value)}   >
        { props.children }
    </Input>
}


const Anchor = (props) => {
    return <a href="#" {...props}>{props.text}</a>
}

const validate = (values) => {
    const errors = {};
    if(!values.name){
        errors.name = ['Required.']
    }
    errors.limitations = values.limitations.map(p => {
        return !p && ['Required.']
    });
    return errors;
}


export class ShareClassForm extends React.Component {
    constructor(props) {
        super(props);
        this.submit = ::this.submit;
    }

    handleDrop(e, files){
        e.preventDefault();
        e.stopPropagation();
        this.props.fields.documents.onChange(files)
    }

    submit(data) {
        if(this.props.submit){
            return this.props.submit(data);
        }
        const body = new FormData();
        body.append('json', JSON.stringify({...data, documents: null}));
        (data.documents || []).map(d => {
            body.append('documents', d, d.name);
        });
        const key = this.props.companyId;
        return (!this.props.edit ? this.props.dispatch(createResource('/company/'+key+'/share_classes/create', body, {stringify: false}))
             : this.props.dispatch(updateResource('/company/'+key+'/share_classes/'+this.props.shareClassId, body, {stringify: false})))
            .then(() => {
                this.props.dispatch(addNotification({message: 'Share Class Added'}));
                this.props.end && this.props.end();
            })
            .catch((err) => {
                this.props.dispatch(addNotification({message: err.message, error: true}))
            });
    }

    render() {
        const {
            addValue,
            fields,
            handleSubmit,
            resetForm,
            invalid,
            submitting
        } = this.props;
        const referenceUrl = 'https://browser.catalex.nz/open_article/instrument/DLM320143';
        const votingRights = ["1(a)", "1(b)", "1(c)"];
        return <form onSubmit={handleSubmit(this.submit)}>
            <fieldset>
            <legend>Create New Share Class</legend>
            <div className="form-group"><LawBrowserLink title="Companies Act 1993" location="s 37">Learn more about share classes</LawBrowserLink></div>
            <Input type="text" {...fields.name} bsStyle={fieldStyle(fields.name)} help={fieldHelp(fields.name)} label="Share Class Name" className="share-class-name" hasFeedback />

            <div className="form-group"><label>{ STRINGS.shareClasses.votingRights.votingRights }</label></div>
            { votingRights.map((v, i) => {
                return <Input key={i} type="checkbox" {...fields.votingRights[v]} bsStyle={fieldStyle(fields.votingRights[v])}
                    help={fieldHelp(fields.votingRights[v])} label={STRINGS.shareClasses.votingRights[v]} hasFeedback />
            }) }
            <div className="form-group"><LawBrowserLink title="Companies Act 1993" location="s 36">Learn more about rights attached to shares</LawBrowserLink></div>
            { fields.rights.map((n, i) => {
                return <Input key={i} type="textarea" rows="3" {...n} bsStyle={fieldStyle(n)} help={fieldHelp(n)} label="Describe Right" hasFeedback
                buttonAfter={<button className="btn btn-default" onClick={() => fields.rights.removeField(i)}><Glyphicon glyph='trash'/></button>}  />
            }) }
            <div className="form-group"><div className="button-row"><ButtonInput onClick={() => {
                fields.rights.addField();    // pushes empty child field onto the end of the array
            }}>Add Right</ButtonInput></div></div>
             <div className="form-group"><LawBrowserLink title="Companies Act 1993" location="s 87(1)">Learn more about transfer restrictions</LawBrowserLink></div>

             <SelectBoolean {...fields.transferRestriction} bsStyle={fieldStyle(fields.transferRestriction)}
                    help={fieldHelp(fields.transferRestriction)} label={STRINGS.shareClasses.transferRestrictionQuestion} hasFeedback >
                    <option value={false}>No</option>
                    <option value={true}>Yes</option>
            </SelectBoolean>

             { fields.transferRestriction.value &&
              <Input  {...fields.transferRestrictionDocument} bsStyle={fieldStyle(fields.transferRestrictionDocument)} className="combobox-wrapper"
                    help={fieldHelp(fields.transferRestrictionDocument)} label={STRINGS.shareClasses.transferRestrictionDocument} hasFeedback >
                        <Combobox {...fields.transferRestrictionDocument} data={transferRestrictionDocumentLocations} itemComponent={Anchor} placeholder={STRINGS.shareClasses.transferRestrictionPlaceholder}/>
                    </Input>
                }

            { fields.limitations.map((n, i) => {
                return <Input key={i} type="textarea" rows="3" {...n} bsStyle={fieldStyle(n)} help={fieldHelp(n)} label="Limitation or Restriction" hasFeedback
                buttonAfter={<button className="btn btn-default" onClick={() => fields.limitations.removeField(i)}><Glyphicon glyph='trash'/></button>}  />
            }) }



            { fields.transferRestriction.value &&  <div className="form-group"><div className="button-row"><ButtonInput onClick={() => {
                fields.limitations.addField();    // pushes empty child field onto the end of the array
            }}>Add Limitation/Restriction</ButtonInput></div></div> }

            {!this.props.noDocuments && <DropZone className="dropzone" { ...fields.documents } rejectClassName={'reject'} activeClassName={'accept'} disablePreview={true}
                  onDrop={ ( filesToUpload, e ) => this.handleDrop(e, filesToUpload) }>
                  <div>Try dropping some files here, or click to select files to upload.</div>
            </DropZone>}



           {((fields.documents|| {}).value || []).map((file, i) => {
                return  <StaticField type="static" key={i} label="File" key={i}
                hasFeedback groupClassName='has-group' value={file.name}
                buttonAfter={<button className="btn btn-default" onClick={() => {
                    const clone = fields.documents.value.slice();
                    clone.splice(i, 1);
                    fields.documents.onChange(clone);
                }}><Glyphicon glyph='trash'/></button>} />
                }) }
            </fieldset>
            <div className="button-row">
                <ButtonInput  disabled={submitting} onClick={resetForm}>Reset</ButtonInput>
                <ButtonInput type="submit" bsStyle="primary" className="submit-new" disabled={submitting || invalid}>{ this.props.edit ? 'Update': 'Create'}</ButtonInput>
            </div>
        </form>
    }
}

const ShareClassFormConnected = reduxForm({
  form: 'shareClass',
  fields: shareClassFields,
  validate
})(ShareClassForm);


export class ShareClassCreate extends React.Component {
    render() {
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <ShareClassFormConnected {...this.props} />
            </div>
        </div>
    }
}

export class ShareClassEdit extends React.Component {
    render() {
        const state = this.props.shareClasses.filter(s => {
            return s.id.toString() === this.props.routeParams.shareClassId;
        })[0];

        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <ShareClassFormConnected {...this.props} initialValues={{...state.properties, name: state.name}} edit={true} shareClassId={state.id}/>
            </div>
        </div>
    }
}


export class ShareClassCreateModal extends React.Component {
    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Create Share Class</Modal.Title>
              </Modal.Header>
              <Modal.Body>
              <div className="row">
                <div className="col-md-6 col-md-offset-3">
                    <ShareClassFormConnected {...this.props.modalData} end={this.props.end} />
                </div>
            </div>

          </Modal.Body>
        </Modal>
    }
}


export class ShareClassEditModal extends React.Component {
    render() {
        const state = this.props.modalData.shareClasses.filter(s => {
            return s.id === this.props.modalData.shareClassId;
        })[0];

        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Create Share Class</Modal.Title>
              </Modal.Header>
              <Modal.Body>
              <div className="row">
                <div className="col-md-6 col-md-offset-3">
                    <ShareClassFormConnected {...this.props.modalData} end={this.props.end}  initialValues={{...state.properties, name: state.name}} edit={true} shareClassId={state.id}/>
                </div>
            </div>

          </Modal.Body>
        </Modal>
    }
}

export function renderRights(data = {}){
    if(Object.keys(data || {}).filter(d => data[d]).length){
        return <ul>{ Object.keys(data || {}).filter(d => data[d]).map((d, i) => {
            return <li key={i}>{STRINGS.shareClasses.votingRights[d]}</li>
        }) }</ul>
    }
    return <ul><li>No Rights</li></ul>;
}

export function renderLimitations(data = []){
    if(data.length){
        return <ul>{ data.map((d, i) => <li key={i}>{d}</li>)}</ul>;
    }
    return <ul><li>No Limitations</li></ul>;
}

function renderField(key, data, row) {
    switch(key){
        case 'limitations':
            return renderLimitations(row.properties.limitations);
        case 'transferRestriction':
            return row.properties.transferRestriction ? 'Yes' : 'No';
        case 'votingRights':
            return renderRights(row.properties.votingRights);
        case 'documents':
            return renderDocumentLinks(data || [])
        default:
            return data;
    }
}



export class ShareClassesTable extends React.Component {
    static fields = ['name', 'votingRights', 'transferRestriction', 'documents']

    renderList(data) {
        return <div>
            <table className="table table-hover table-striped">
                <thead>
                <tr>{ ShareClassesTable.fields.map((f, i) => {
                    return <th key={i}>{STRINGS.shareClasses[f]._ || STRINGS.shareClasses[f]}</th>
                })}</tr>
                </thead>
                <tbody>
                    { data.map((row, i) => {
                        return <tr key={i} onClick={() => this.props.editShareClass(row.id)}>
                            { ShareClassesTable.fields.map((field, i) => {
                                return <td key={i}>{renderField(field, row[field], row)}</td>
                            }) }
                        </tr>
                    })}
                </tbody>
            </table>
            { this.props.navButton && <div className="button-row">
                <div><Link to={this.props.location.pathname +'/create'} className="btn btn-primary create-new">Create New Share Class</Link></div>
            </div> }

            { this.props.modalButton && <div className="button-row">
               <Button bsStyle="primary" onClick={this.props.createModal}>Create New Share Class</Button>
               { !!data.length && <Button bsStyle="success" onClick={this.props.end}>Finished Creating Share Classes</Button> }
            </div> }

        </div>
    }

    key() {
        return this.props.params.id
    };

    render() {
        const classes = ((this.props.companyState.shareClasses || {}).shareClasses || []);
        return <div className="container">
            <div className="row">
            <div className="col-md-12">
            <div className="widget">
                <div className="widget-header">
                    <div className="widget-title">
                        Share Classes
                    </div>
                </div>
                <div className="widget-body">
                    { !this.props.children && this.renderList(classes) }
                     { this.props.children && React.cloneElement(this.props.children, {
                            companyId: this.key(),
                            companyState: this.props.companyState,
                            shareClasses: classes,
                            end: () => this.props.navigate(`/company/view/${this.key()}/share_classes`)
                    }) }
                </div>
            </div>
            </div>
            </div>
        </div>
    }
}

export const ShareClasses = connect(undefined, (dispatch, ownProps) => ({
    editShareClass: (id) => dispatch(push(`${ownProps.location.pathname}/view/${id}`)),
    navigate: (url) => dispatch(push(url))
}))((props) => <ShareClassesTable navButton={true} {...props} />)





export const ShareClassManageModal  = (props) => {
    const shareClasses = ((props.modalData.companyState.shareClasses || {}).shareClasses || []);
    return <ShareClassesTable  {...props.modalData}
    modalButton={true}
    createModal={() => props.show('createShareClass', {...props.modalData, afterClose: {showModal: {key: 'manageShareClasses', data: {loadCompanyState: true} }}  })}
    editShareClass={(id) => props.show('editShareClass', {...props.modalData, shareClasses: shareClasses, shareClassId: id, afterClose: {showModal: {key: 'manageShareClasses', data: {loadCompanyState: true} }}  })}
    end={props.end} />
};




