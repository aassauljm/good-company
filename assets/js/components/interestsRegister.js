"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import { requestResource, createResource, updateResource, addNotification } from '../actions';
import { pureRender, numberWithCommas, stringDateToFormattedString } from '../utils';
import { connect } from 'react-redux';
import { reduxForm, addArrayValue } from 'redux-form';
import { InterestsRegisterFromRouteHOC, CompanyFromRouteHOC, AllPersonsHOC } from '../hoc/resources'
import { Link } from 'react-router';
import Input from './forms/input';
import Download from './forms/download';
import ButtonInput from './forms/buttonInput';
import { fieldStyle, fieldHelp, objectValues, validateWithSchema, requireFields, renderDocumentLinks } from '../utils';
import DateInput from './forms/dateInput';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Button from 'react-bootstrap/lib/Button';
import { Documents } from './forms/documents';
import STRINGS from '../strings';
import { push } from 'react-router-redux';
import StaticField from './forms/staticField';
import LawBrowserLink from './lawBrowserLink';
import LawBrowserContainer from './lawBrowserContainer'
import Loading from './loading';
import Widget from './widget';
import { asyncConnect } from 'redux-connect';
import FormData from 'form-data';

const interestsRegisterLawLinks = () => <div>
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


class EntryForm extends React.PureComponent {
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
                this.props.dispatch(push(`/company/view/${key}/registers/interests_register`))
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
        return <form onSubmit={handleSubmit(this.submit)} className="interests-entry">
            <fieldset>
            { fields.persons.map((n, i) => {
                return <Input type="select" key={i} {...n} bsStyle={fieldStyle(n)} help={fieldHelp(n)} label="Interested Person"
                hasFeedback groupClassName='has-group'
                buttonAfter={<button className="btn btn-default" onClick={() => fields.persons.removeField(i)}><Glyphicon glyph='trash'/></button>} >
                    <option></option>
                   { this.props.persons.filter(p => p.director).map((p, i) => {
                        return <option key={i} value={p.latestId}>{ p.name } { !p.current && ' (Former director)'}</option>
                   }) }
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
                <ButtonInput onClick={() => this.props.dispatch(push(`/company/view/${this.props.companyId}/registers/interests_register`))}>Cancel</ButtonInput>
                <ButtonInput  disabled={submitting} onClick={resetForm}>Reset</ButtonInput>
                 <ButtonInput type="submit" bsStyle="primary" disabled={submitting || invalid} >Create</ButtonInput>
            </div>
        </form>
    }
}

const ConnectedForm = reduxForm({
    form: 'interestEntry',
    fields,
    validate
}, undefined, {
    addValue: addArrayValue
})(EntryForm);

@AllPersonsHOC()
export class InterestsRegisterCreate extends React.PureComponent {
    render() {
        const persons = this.props[`/company/${this.props.companyId}/all_persons`].data || []
        const loading = this.props[`/company/${this.props.companyId}/all_persons`]._status === 'fetching';
        if(loading){
            return <Loading />
        }

        return <ConnectedForm persons={persons} companyId={this.props.companyId} companyState={this.props.companyState} initialValues={{persons: [''], date: new Date()}} />
    }
}


function renderField(key, data, companyId) {
    switch(key){
        case 'date':
            return stringDateToFormattedString(data);
        case 'documents':
            return renderDocumentLinks(data || [], companyId)
        case 'persons':
            return (data || []).map(d => d.name).join(', ')
        case 'details':
        default:
            return data;
    }
}

@connect((state, ownProps) => {
    return {...state.resources[`/company/${ownProps.params.id}/interests_register/remove/${ownProps.params.entryId}`]}
}, {
    deleteEntry: (companyId, entryId) => updateResource(`/company/${companyId}/interests_register/remove/${entryId}`, {}, {
         confirmation: {
            title: 'Confirm Removal',
            description: 'Please confirm the  removal of this entry',
            resolveMessage: 'Confirm Removal',
            resolveBsStyle: 'danger'
        }
    }),
    addNotification: (...args) => addNotification(...args),
    push: (...args) => push(...args)
})
export class InterestsRegisterView extends React.PureComponent {
    static propTypes = {
        interestsRegister: PropTypes.array,
    };

    destroy() {
        const companyId = this.props.companyId;
        const request = this.props.deleteEntry(companyId, this.props.params.entryId)
        request
            .then(() => {
                this.props.addNotification({message: 'Entry Removed'});
                this.props.push(`/company/view/${companyId}/registers/interests_register`)
            })
            .catch((e) => {
                this.props.addNotification({message: e.message, error: true});
            })
    }

    render() {
        const companyId = this.props.companyId;
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
                    <dd>{ renderField('documents', entry.documents, companyId) }</dd>
                </dl>
                  <div className="button-row">
                    <Link className='btn btn-default' to={`/company/view/${companyId}/registers/interests_register`}>Back</Link>
                    <Button className="btn btn-danger" onClick={() => this.destroy()}>Remove Entry</Button>
                 </div>
            </div>
        </div>
    }
}


@InterestsRegisterFromRouteHOC(true)
@connect(undefined, {
    viewEntry: (path, id) => push(path + '/view/'+id)
})
export class InterestsRegister extends React.PureComponent {

    static fields = ['date', 'persons', 'details', 'documents']
    renderControls() {
        return <Download block={true} url={`/api/company/render/${this.props.companyId}/interests_register`}/>
    }
    renderList(data) {
        const companyId = this.props.companyId;
        return <div>

            { !!data.length && this.renderControls() }
            <table className="table table-hover table-striped interests-register-table">
                <thead>
                <tr>{ InterestsRegister.fields.map((f, i) => {
                    return <th key={i}>{STRINGS.interestsRegister[f]}</th>
                })}</tr>
                </thead>
                <tbody>
                    { data.map((row, i) => {
                        return <tr key={i} onClick={() => this.props.viewEntry(this.props.location.pathname, row.id)}>
                            { InterestsRegister.fields.map((field, i) => {
                                return <td key={i}>{renderField(field, row[field], companyId)}</td>
                            }) }
                        </tr>
                    })}
                </tbody>
            </table>
             { this.props._status === 'fetching' && <Loading />}
            <div className="button-row">
            { this.canUpdate() && <div><Link to={this.props.location.pathname +'/create'} className="btn btn-primary">Create New Entry</Link></div> }
            </div>
        </div>
    }

    canUpdate() {
        return (this.props.companyState.permissions || []).indexOf('update') >= 0;
    }


    key() {
        return this.props.params.id
    };

    render() {
        const interestsRegister = (this.props.interestsRegister.data || []);
        return <LawBrowserContainer lawLinks={interestsRegisterLawLinks()}>
                <Widget title="Interests Register">
                        { !this.props.children && this.renderList(interestsRegister) }
                         { this.props.companyState && this.props.children && React.cloneElement(this.props.children, {
                                companyId: this.key(),
                                companyState: this.props.companyState,
                                interestsRegister: interestsRegister
                        }) }
                        </Widget>
            </LawBrowserContainer>
    }
}

function InterestsRegisterTable(props) {
    const companyId = props.companyId;
    const companyState = props.companyState;
    return <div className="interests-register-document">
        <div className="title"><h2>Interests Register</h2></div>
            <table className="heading">
                <tbody><tr>
                <td>
                <h2>{ companyState.companyName }</h2>
                </td>
                <td>
                <h4>NZBN: { companyState.nzbn }</h4>
                <h4>Company Number #{ companyState.companyNumber }</h4>
                </td>
                </tr>
                </tbody>
            </table>

     {  props.interestsRegister.map((row, i) => {
        return <div key={i} className="row">
           { ['date', 'persons'].map((field, i) => {
            return <div className="col-xs-12" key={i}><strong> { STRINGS.interestsRegister[field] }</strong><p> {renderField(field, row[field], companyId)}</p></div>
             }) }

           <div className="col-xs-12">
               <strong> { STRINGS.interestsRegister.details } </strong>
                <p>{ row.details }</p>
           </div>
           { !!row.documents.length && <div className="col-xs-12">
                <strong> { STRINGS.interestsRegister.documents } </strong>
                {row.documents.filter(d => d.type !== 'Directory').map((d, i) => {
                    return <div key={i}><em>{ d.filename }</em></div>
                }) }
           </div> }
           { i < props.interestsRegister.length -1 && <hr />}
        </div>
    }) }
     </div>
}

const DEFAULT_OBJ = {};


@InterestsRegisterFromRouteHOC(true)
export class InterestsRegisterDocumentLoader extends React.PureComponent {
    static propTypes = {
        interestsRegister: PropTypes.object.isRequired
    };
    render() {
        const companyState = ((this.props['/company/'+this.props.params.id +'/get_info'] || {}).data || {}).currentCompanyState;
        return <InterestsRegisterTable interestsRegister={this.props.interestsRegister.data} companyState={companyState} companyId={this.props.companyId}/>
    }
}

