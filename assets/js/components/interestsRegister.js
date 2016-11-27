"use strict";
import React, { PropTypes } from 'react';
import { requestResource, createResource, addNotification } from '../actions';
import { pureRender, numberWithCommas, stringDateToFormattedString } from '../utils';
import { connect } from 'react-redux';
import { reduxForm, addArrayValue } from 'redux-form';
import { Link } from 'react-router';
import Input from './forms/input';
import ButtonInput from './forms/buttonInput';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import { fieldStyle, fieldHelp, objectValues, validateWithSchema, requireFields, renderDocumentLinks } from '../utils';
import DateInput from './forms/dateInput';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { Documents } from './forms/documents';
import STRINGS from '../strings';
import { push } from 'react-router-redux';
import StaticField from './forms/staticField';
import LawBrowserLink from './lawBrowserLink';
import LawBrowserContainer from './lawBrowserContainer'


const interestRegisterLawLinks = () => <div>
        <LawBrowserLink title="Companies Act 1993" definition="28784-DLM319933">Keeping of interests register</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 139">Interests of directors in company transactions</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 107(3)+140">Disclosure of director interests</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 107(3)+141-143">Avoidance of transactions wth interested directors</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 144">Voting rights of interested directors</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 145(1)(c)+(2)+(3)">Use of company information</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 161(1)+(2)+107(1)(f)">Director remuneration and benefits</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 162(7)">Director indemnities and insurance</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 216(1)(d) + 217">Shareholder inspection of interests register</LawBrowserLink>
    </div>



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
        /*['date', 'details', 'persons'].forEach(( key ) => {
            body.append(key, data[key]);
        });*/
        body.append('json', JSON.stringify({...data, documents: null}));

        (data.documents ||[]).map(d => {
            body.append('documents', d, d.name);
        })

        const key = this.props.companyId;
        return this.props.dispatch(createResource(`/company/${key}/interests_register/create`, body, {stringify: false}))
            .then(() => {
                this.props.dispatch(addNotification({message: 'Entry Added'}))
                this.props.dispatch(push(`/company/view/${key}/interests_register`))
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
        //189(1)(c)
        return <form onSubmit={handleSubmit(this.submit)}>
            <fieldset>
            { fields.persons.map((n, i) => {
                return <Input type="select" key={i} {...n} bsStyle={fieldStyle(n)} help={fieldHelp(n)} label="Interested Person"
                hasFeedback groupClassName='has-group'
                buttonAfter={<button className="btn btn-default" onClick={() => fields.persons.removeField(i)}><Glyphicon glyph='trash'/></button>} >
                    <option></option>
                    { ((this.props.companyState.directorList || {}).directors || []).map((d, i) => {
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
            <Input type="textarea" rows="6" {...fields.details} bsStyle={fieldStyle(fields.details)} help={fieldHelp(fields.details)} label="Details of Interest" hasFeedback />

            <Documents documents={fields.documents } />

            </fieldset>
            <div className="button-row">
                <ButtonInput onClick={() => this.props.dispatch(push(`/company/view/${this.props.companyId}/interests_register`))}>Cancel</ButtonInput>
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
        return <ConnectedForm companyId={this.props.companyId} companyState={this.props.companyState}/>
    }
}


function renderField(key, data) {
    switch(key){
        case 'date':
            return stringDateToFormattedString(data);
        case 'documents':
            return renderDocumentLinks(data || [])
        case 'persons':
            return (data || []).map(d => d.name).join(', ')
        case 'details':
        default:
            return data;
    }
}


export class InterestsRegisterView extends React.Component {
    static propTypes = {
        interestsRegister: PropTypes.array,
    };

    render() {
        const entry = this.props.interestsRegister.filter(i => i.id+'' === this.props.params.entryId)[0] || {};
        return  <div className="row">
            <div className="col-md-12">
                <dl className="dl-horizontal">
                    <dt>ID</dt>
                    <dd>{ entry.id}</dd>
                    <dt>Date</dt>
                    <dd>{ renderField('date', entry.date) }</dd>
                    <dt>Persons</dt>
                    <dd>{ renderField('persons', entry.persons) }</dd>
                    <dt>Details</dt>
                    <dd>{ renderField('details', entry.details) }</dd>
                    <dt>Documents</dt>
                    <dd>{ renderField('documents', entry.documents) }</dd>
                </dl>
            </div>
        </div>
    }
}



@connect((state, ownProps) => {
    return {data: [], ...state.resources['/company/'+ownProps.params.id +'/interests_register']}
}, {
    requestData: (key) => requestResource('/company/'+key+'/interests_register'),
    viewEntry: (path, id) => push(path + '/view/'+id)
})
export class InterestsRegister extends React.Component {

    static fields = ['date', 'persons', 'details', 'documents']

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
                        return <tr key={i} onClick={() => this.props.viewEntry(this.props.location.pathname, row.id)}>
                            { InterestsRegister.fields.map((field, i) => {
                                return <td key={i}>{renderField(field, row[field])}</td>
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
        return <LawBrowserContainer lawLinks={interestRegisterLawLinks()}>
            <div className="widget">
                <div className="widget-header">
                    <div className="widget-title">
                        Interests Register
                    </div>
                </div>
                <div className="widget-body">
                        { !this.props.children && this.renderList(interestsRegister) }
                         { this.props.companyState && this.props.children && React.cloneElement(this.props.children, {
                                companyId: this.key(),
                                companyState: this.props.companyState,
                                interestsRegister: interestsRegister
                        }) }
                </div>
            </div>
            </LawBrowserContainer>
    }
}

