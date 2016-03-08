"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from 'react-bootstrap/lib/ButtonInput';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from '../forms/input';
import STRINGS from '../../strings'
import { fieldStyle, fieldHelp, formFieldProps, requireFields } from '../../utils';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { createResource, addNotification } from '../../actions';
import DropZone from 'react-dropzone';
import StaticField from 'react-bootstrap/lib/FormControls/Static';


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

    }

    handleDrop(e, files){
        e.preventDefault();
        e.stopPropagation();
        this.props.fields.documents.onChange(files)
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

        return <form>
            <fieldset>
            <div className="col-md-8 col-md-offset-2">
            <legend>Create New Share Class</legend>

            <Input type="text" {...fields.name} bsStyle={fieldStyle(fields.name)} help={fieldHelp(fields.name)} label="Share Class Name" hasFeedback />

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
           </div>
            </fieldset>
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

@connect(null, {
    createResource: (key, body) => createResource('/company/'+key+'/share_classes/create', body, {stringify: false}),
    addNotification: (message, error) => addNotification({error: error, message: message})
})
export default class ShareClassesModal extends React.Component {
    constructor(props) {
        super(props);
        this.handleNext = ::this.handleNext;
        this.submit = ::this.submit;
    }

    handleNext(e) {
        e.preventDefault();
        this.refs.form.submit();
    }

    submit(data) {
        const body = new FormData();
        body.append('json', JSON.stringify({...data, documents: null}));
        (data.documents || []).map(d => {
            body.append('documents', d, d.name);
        })

        const key = this.props.modalData.companyId;
        return this.props.createResource(key, body)
            .then(() => {
                this.props.addNotification('Share Class Added')
                //this.props.dispatch(routeActions.push(`/company/view/${key}/interests_register`))
            })
            .catch((err) => {
                this.props.addNotification(err.message, true)
            });
    }


    render() {
        console.log(this.props)
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Share Classes</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                   <table className="table">
                   <thead></thead>
                   <tbody></tbody>
                   </table>
                   <ShareClassFormConnected ref={"form"} onSubmit={this.submit} />
              </Modal.Body>
              <Modal.Footer>
                 <Button onClick={this.props.end} >Close</Button>
                 <Button onClick={this.handleNext} bsStyle="primary">{ 'Submit' }</Button>
              </Modal.Footer>
            </Modal>
    }

}