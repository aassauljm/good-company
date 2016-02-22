"use strict";
import React, {PropTypes} from 'react';
import { requestResource, createResource, addNotification } from '../actions';
import { pureRender, numberWithCommas } from '../utils';
import { connect } from 'react-redux';
import {reduxForm, addArrayValue} from 'redux-form';
import { Link } from 'react-router';
import Input from './forms/input';
import ButtonInput from './forms/buttonInput';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import { fieldStyle, fieldHelp, objectValues, validateWithSchema, requireFields } from '../utils';
import DateInput from './forms/dateInput';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import STRINGS from '../strings';
import { routeActions } from 'react-router-redux'
import DropZone from 'react-dropzone';

export const fields = [
  'parties[].name',
  'date',
  'details',
  'documents'
];

const validateFields = requireFields('date', 'details');
const validateParty = requireFields('name');

const validate = (values) => {
    const errors = validateFields(values);
    errors.parties = values.parties.map(p => validateParty(p));
    if(!values.parties.length){
        errors.parties = [];
        errors.parties._error = ['At least one required.'];
    }
    return errors;
}

class EntryForm extends React.Component {
    static propTypes = {
        addValue: PropTypes.func.isRequired,
        fields: PropTypes.object.isRequired,
        handleSubmit: PropTypes.func.isRequired,
        resetForm: PropTypes.func.isRequired,
        invalid: PropTypes.bool.isRequired,
        submitting: PropTypes.bool.isRequired
    };

    constructor(props) {
        super(props);
        this.submit = ::this.submit;
    }


    submit(data) {
        const body = new FormData();
        ['date', 'details'].forEach(( key ) => {
            body.append(key, data[key]);
        });
        data.documents.map(d => {
            body.append('documents', d, d.name);
        })

        const key = this.props.companyId;
        return this.props.dispatch(createResource(`/company/${key}/interests_register/create`, body, {stringify: false}))
            .then(() => {
                this.props.dispatch(addNotification({message: 'Entry Added'}))
                this.props.dispatch(routeActions.push(`/company/view/${key}/interests_register`))
            })
            .catch((err) => {
                this.props.dispatch(addNotification({error: true, message: err.message}))
            });
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
        return <form onSubmit={handleSubmit(this.submit)}>
            <fieldset>
            <legend>Create Interests Registry Entry</legend>
            { fields.parties.map((n, i) => {
                return <Input type="text" key={i} {...n.name} bsStyle={fieldStyle(n.name)} help={fieldHelp(n.name)} label="Name"
                hasFeedback groupClassName='has-group'
                buttonAfter={<button className="btn btn-default" onClick={() => fields.parties.removeField(i)}><Glyphicon glyph='trash'/></button>}/>
            }) }
            { fields.parties.error && fields.parties.error.map(e => {
                return <span className="help-block">{ e} </span>
            })}
            <ButtonInput onClick={() => {
                fields.parties.addField();    // pushes empty child field onto the end of the array
            }}>Add Party</ButtonInput>
             <DateInput {...fields.date} bsStyle={fieldStyle(fields.date)} help={fieldHelp(fields.date)} label="Date" hasFeedback />
            <Input type="textarea" rows="6" {...fields.details} bsStyle={fieldStyle(fields.details)} help={fieldHelp(fields.details)} label="Details" hasFeedback />
              <DropZone className="dropzone" { ...fields.documents } rejectClassName={'reject'} activeClassName={'accept'} disablePreview={true}
                  onDrop={ ( filesToUpload, e ) => this.handleDrop(e, filesToUpload) }>
                  <div>Try dropping some files here, or click to select files to upload.</div>
            </DropZone>
            <div>{((this.props.fields.documents|| {}).value || []).map((file, i) => <div key={i}>{file.name}</div> )}</div>
            </fieldset>
            <div className="button-row">
                <ButtonInput  disabled={submitting} onClick={resetForm}>Reset</ButtonInput>
                <ButtonInput type="submit" bsStyle="primary" disabled={submitting || invalid}>Create</ButtonInput>
            </div>
        </form>
    }
}

const ConnectedForm = reduxForm({
    form: 'interestEntry',
    fields,
    validate
}, state => ({
    initialValues: {parties: [{name: '1'}], details: '1'}
}), {
    addValue: addArrayValue
})(EntryForm);


export class InterestsRegisterCreate extends React.Component {
    render() {
        return  <div className="col-md-6 col-md-offset-3">
                <ConnectedForm companyId={this.props.companyId}/>
        </div>
    }
}


@connect((state, ownProps) => {
    return {data: [], ...state.resources['/company/'+ownProps.params.id +'/interests_register']}
}, {
    requestData: (key) => requestResource('/company/'+key+'/interests_register')
})
export class InterestsRegister extends React.Component {

    static fields = ['date', 'parties', 'details', 'documents']

    renderField(key, data) {
        if(Array.isArray(data)){
            return  data.join(', ');
        }
        switch(key){
            case 'date':
                return new Date(data).toDateString();
            case 'details':
            default:
                return data;
        }
    }


    renderList(data) {
        return <div>
            <table className="table table-hover table-striped">
                <thead>
                <tr>{ InterestsRegister.fields.map((f, i) => {
                    return <th key={i}>{STRINGS.interestsRegister[f]}</th>
                })}</tr>
                </thead>
                <tbody>
                    { data.map((row, i) => {
                        return <tr key={i}>
                            { InterestsRegister.fields.map((field, i) => {
                                return <td key={i}>{this.renderField(field, row[field])}</td>
                            }) }
                        </tr>
                    })}
                </tbody>
            </table>
            <div className="button-row">
            <div><Link to={this.props.location.pathname +'/create'} className="btn btn-primary">Create New Entry</Link></div>
            </div>
        </div>
    }

    fetch() {
        return this.props.requestData(this.key());
    };

    key() {
        return this.props.params.id
    };

    componentDidMount() {
        this.fetch();
    };

    componentDidUpdate() {
        this.fetch();
    };
    render() {
        const interestsRegister = (this.props.data || []);
        return <div>
                    <div className="container">
                        { !this.props.children && this.renderList(interestsRegister) }
                         { this.props.children && React.cloneElement(this.props.children, {
                                companyId: this.key()
                        }) }
                    </div>
                </div>
    }
}