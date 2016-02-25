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
import StaticField from 'react-bootstrap/lib/FormControls/Static';


export const fields = [
  'persons[]',
  'date',
  'details',
  'documents'
];

const validateFields = requireFields('date', 'details');


const validate = (values) => {
    const errors = validateFields(values);
    const persons = [];
    errors.persons = values.persons.map(p => {
        if(p && persons.indexOf(p) > -1){
            return ['Person already included'];
        }
        persons.push(p);
        return !p && ['Person required.']
    });

    if(!values.persons.length){
        errors.persons = [];
        errors.persons._error = ['At least one required.'];
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
        ['date', 'details', 'persons'].forEach(( key ) => {
            body.append(key, data[key]);
        });
        (data.documents ||[]).map(d => {
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

            { fields.persons.map((n, i) => {
                return <Input type="select" key={i} {...n} bsStyle={fieldStyle(n)} help={fieldHelp(n)} label="Name"
                hasFeedback groupClassName='has-group'
                buttonAfter={<button className="btn btn-default" onClick={() => fields.persons.removeField(i)}><Glyphicon glyph='trash'/></button>} >
                    <option></option>
                    { this.props.companyState.directors.map((d, i) => {
                        return <option key={i} value={d.person.id}>{d.person.name}</option>
                    })}
                </Input>
            }) }
            { fields.persons.error && fields.persons.error.map((e, i) => {
                return <span key={i} lassName="help-block">{e} </span>
            })}
            <div className="button-row"><ButtonInput onClick={() => {
                fields.persons.addField();    // pushes empty child field onto the end of the array
            }}>Add Person</ButtonInput></div>
            <DateInput {...fields.date} bsStyle={fieldStyle(fields.date)} help={fieldHelp(fields.date)} label="Date" hasFeedback />
            <Input type="textarea" rows="6" {...fields.details} bsStyle={fieldStyle(fields.details)} help={fieldHelp(fields.details)} label="Details" hasFeedback />

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
    initialValues: {persons: [{}], }
}), {
    addValue: addArrayValue
})(EntryForm);


export class InterestsRegisterCreate extends React.Component {
    render() {
        return  <div className="col-md-6 col-md-offset-3">
                <ConnectedForm companyId={this.props.companyId} companyState={this.props.companyState}/>
        </div>
    }
}

function renderDocumentLinks(list){
    return list.map((d, i) =>
        <div key={i}><Link  activeClassName="active" className="nav-link" to={"/document/view/"+d.id} >
            {d.filename}
        </Link></div>);
}


@connect((state, ownProps) => {
    return {data: [], ...state.resources['/company/'+ownProps.params.id +'/interests_register']}
}, {
    requestData: (key) => requestResource('/company/'+key+'/interests_register')
})
export class InterestsRegister extends React.Component {

    static fields = ['date', 'persons', 'details', 'documents']

    renderField(key, data) {
        switch(key){
            case 'date':
                return new Date(data).toDateString();
            case 'documents':
                return renderDocumentLinks(data || [])
            case 'persons':
                return data.map(d => d.name).join(', ')
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
                                companyId: this.key(),
                                companyState: this.props.companyState
                        }) }
                    </div>
                </div>
    }
}