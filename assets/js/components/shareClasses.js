"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from 'react-bootstrap/lib/ButtonInput';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { reduxForm } from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { fieldStyle, fieldHelp, formFieldProps, requireFields, renderDocumentLinks, pureRender } from '../utils';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { createResource, addNotification } from '../actions';
import DropZone from 'react-dropzone';
import StaticField from 'react-bootstrap/lib/FormControls/Static';
import { push } from 'react-router-redux';
import FormData from 'form-data';

const defaultShareClass = '___default';

const shareClassFields = [
    "name",
    "votingRights.appointDirectorAuditor",
    "votingRights.adoptConstitution",
    "votingRights.alterConstitution",
    "votingRights.approveMajorTransactions",
    "votingRights.approveAmalgamation",
    "votingRights.liquidation",
    "limitations[]",
    "documents"
];


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
        const body = new FormData();
        body.append('json', JSON.stringify({...data, documents: null}));
        (data.documents || []).map(d => {
            body.append('documents', d, d.name);
        });
        const key = this.props.companyId;
        return this.props.dispatch(createResource('/company/'+key+'/share_classes/create', body, {stringify: false}))
            .then(() => {
                this.props.dispatch(addNotification({message: 'Share Class Added'}))
                this.props.dispatch(push(`/company/view/${key}/share_classes`))
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

        const votingRights = [
            "appointDirectorAuditor",
            "adoptConstitution",
            "alterConstitution",
            "approveMajorTransactions",
            "approveAmalgamation",
            "liquidation"];
        return <form onSubmit={handleSubmit(this.submit)}>
            <fieldset>
            <legend>Create New Share Class</legend>

            <Input type="text" {...fields.name} bsStyle={fieldStyle(fields.name)} help={fieldHelp(fields.name)} label="Share Class Name" className="share-class-name" hasFeedback />

            { votingRights.map((v, i) => {
                return <Input key={i} type="checkbox" {...fields.votingRights[v]} bsStyle={fieldStyle(fields.votingRights[v])}
                    help={fieldHelp(fields.votingRights[v])} label={STRINGS.shareClasses.votingRights[v]} hasFeedback />
            }) }

            { fields.limitations.map((n, i) => {
                return <Input key={i} type="textarea" rows="3" {...n} bsStyle={fieldStyle(n)} help={fieldHelp(n)} label="Limitation or Restriction" hasFeedback
                buttonAfter={<button className="btn btn-default" onClick={() => fields.limitations.removeField(i)}><Glyphicon glyph='trash'/></button>}  />
            }) }
            <div className="button-row"><ButtonInput onClick={() => {
                fields.limitations.addField();    // pushes empty child field onto the end of the array
            }}>Add Limitation/Restriction</ButtonInput></div>

            <DropZone className="dropzone" { ...fields.documents } rejectClassName={'reject'} activeClassName={'accept'} disablePreview={true}
                  onDrop={ ( filesToUpload, e ) => this.handleDrop(e, filesToUpload) }>
                  <div>Try dropping some files here, or click to select files to upload.</div>
            </DropZone>

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
                <ButtonInput type="submit" bsStyle="primary" className="submit-new" disabled={submitting || invalid}>Create</ButtonInput>
            </div>
        </form>
    }
}

const ShareClassFormConnected = reduxForm({
  form: 'shareClass',
  fields: shareClassFields,
  validate
}, state => ({
    initialValues: {
        votingRights: {
        appointDirectorAuditor: true,
        adoptConstitution: true,
        alterConstitution: true,
        approveMajorTransactions: true,
        approveAmalgamation: true,
        liquidation: true
        }
    }
})
)(ShareClassForm);


export class ShareClassCreate extends React.Component {
    render() {
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <ShareClassFormConnected {...this.props} />
            </div>
        </div>
    }
}

export class ShareClassView extends React.Component {
    render() {
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                VIEW/EDIT to be implemented.
            </div>
        </div>
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
        case 'votingRights':
            return renderRights(row.properties.votingRights);
        case 'documents':
            return renderDocumentLinks(data || [])
        default:
            return data;
    }
}


@connect(undefined, {
    viewShareClass: (path, id) => push(path + '/view/'+id)
})
export class ShareClasses extends React.Component {
    static fields = ['name', 'votingRights', 'limitations', 'documents']

    renderList(data) {
        return <div>
            <table className="table table-hover table-striped">
                <thead>
                <tr>{ ShareClasses.fields.map((f, i) => {
                    return <th key={i}>{STRINGS.shareClasses[f]._ || STRINGS.shareClasses[f]}</th>
                })}</tr>
                </thead>
                <tbody>
                    { data.map((row, i) => {
                        return <tr key={i} onClick={() => this.props.viewShareClass(this.props.location.pathname, row.id)}>
                            { ShareClasses.fields.map((field, i) => {
                                return <td key={i}>{renderField(field, row[field], row)}</td>
                            }) }
                        </tr>
                    })}
                </tbody>
            </table>
            <div className="button-row">
            <div><Link to={this.props.location.pathname +'/create'} className="btn btn-primary create-new">Create New Share Class</Link></div>
            </div>
        </div>
    }

    key() {
        return this.props.params.id
    };

    render() {
        const classes = ((this.props.companyState.shareClasses || {}).shareClasses || []);
        return <div>
                    <div className="container">
                        { !this.props.children && this.renderList(classes) }
                         { this.props.children && React.cloneElement(this.props.children, {
                                companyId: this.key(),
                                companyState: this.props.companyState,
                                shareClasses: classes
                        }) }
                    </div>
                </div>
            }
}


@pureRender
export class ShareClassesPanel extends React.Component {
    static propTypes = {
    };
    render(){
        return <div className="panel panel-warning" >
            <div className="panel-heading">
            <h3 className="panel-title">Share Classes</h3>
            </div>
            <div className="panel-body">
                Manage your share classes.
            </div>
        </div>
    }
}