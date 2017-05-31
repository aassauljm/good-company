"use strict";
import React, {PropTypes} from 'react';
import TransactionView from './forms/transactionView';
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
import { Documents } from './forms/documents';
import StaticField from './forms/staticField';
import { push } from 'react-router-redux';
import FormData from 'form-data';
import Combobox from 'react-widgets/lib/Combobox';
import LawBrowserLink from './lawBrowserLink';
import LawBrowserContainer from './lawBrowserContainer'
import Widget from './widget';
import Loading from './loading';

export const shareClassLawLinks = () => <div>
        <LawBrowserLink title="Companies Act 1993" definition="28784-DLM320605/28784-DLM319594">Share classes</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 37">Issue of shares in different classes </LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 36">Rights attached to shares</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 87(1)">Restrictions or limitations on share transfers</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 87(2)">Stating information by class on the share register</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 117">Alteration of shareholder rights after interest group approval</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" definition="29156-DLM1522625">Definition of shareholder decision-making right</LawBrowserLink>
    </div>;

const defaultShareClass = '___default';

const shareClassFields = [
    "name",
    "votingRights.1(a)",
    "votingRights.1(b)",
    "votingRights.1(c)",
    "rights[]",
    "decisionMakingRights.dividend",
    "decisionMakingRights.constitution",
    "decisionMakingRights.capitalVariation",
    "decisionMakingRights.appointDirector",
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


const votingRights = ["1(a)", "1(b)", "1(c)"];
const decisionRights = ["dividend", "constitution", "capitalVariation", "appointDirector"];

export class ShareClassForm extends React.Component {
    constructor(props) {
        super(props);
        this.submit = ::this.submit;
        this.selectAllRights = ::this.selectAllRights;
        this.state = {};
    }

    selectAllRights() {
        votingRights.map((v, i) => this.props.fields.votingRights[v].onChange(true));
        decisionRights.map((v, i) => this.props.fields.decisionMakingRights[v].onChange(true));
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
        body.append('json', JSON.stringify({...data,  existingDocuments: (data.documents || []).map(d => d.id).filter(d => d), forceUpdate: this.props.edit}));
        (data.documents || []).filter(d => !d.id).map(d => {
            body.append('documents', d, d.name);
        });
        const key = this.props.companyId;
        return (!this.props.edit ? this.props.dispatch(createResource('/company/'+key+'/share_classes/create', body, {stringify: false}))
             : this.props.dispatch(updateResource('/company/'+key+'/share_classes/'+this.props.shareClassId, body, {stringify: false,
                    confirmation: {
                        title: 'Confirm Correction of Share Class Information',
                        description: 'Updating share class information applies retroactively, and should only be used for corrections.',
                        resolveMessage: 'Confirm Correction',
                        resolveBsStyle: 'warning'}} )))
            .then((result) => {
                this.props.dispatch(addNotification(result.response.message));
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
        const constitutionDocument = this.props.companyState && this.props.companyState.docList && this.props.companyState.docList.documents.find(d => d.filename === 'Adoption Of Constitution');


        return <form onSubmit={handleSubmit(this.submit)} className="share-class-form">
            <fieldset>
            {/* <div className="form-group"><LawBrowserLink title="Companies Act 1993" location="s 37">Learn more about share classes</LawBrowserLink></div> */ }
            <Input type="text" {...fields.name} bsStyle={fieldStyle(fields.name)} help={fieldHelp(fields.name)} label="Share Class Name" className="share-class-name" hasFeedback />

            <div className="form-group"><label>{ STRINGS.shareClasses.votingRights.votingRights }</label></div>
            { votingRights.map((v, i) => {

                return <div key={i}>
                    <Input  type="checkbox" {...fields.votingRights[v]} bsStyle={fieldStyle(fields.votingRights[v])}
                    help={fieldHelp(fields.votingRights[v])} label={STRINGS.shareClasses.votingRights[v]} hasFeedback />

                    <div className="form-group-indent"> { v === '1(a)' &&  <div><em>{ STRINGS.shareClasses.decisionMakingRights._ }:</em></div> }

                    { v === '1(a)' &&  decisionRights.map((v, i) => {
                        return <Input key={i} type="checkbox" {...fields.decisionMakingRights[v]}  bsStyle={fieldStyle(fields.decisionMakingRights[v])}
                            help={fieldHelp(fields.decisionMakingRights[v])} label={STRINGS.shareClasses.decisionMakingRights[v]} hasFeedback />
                    }) }
                    </div>
                </div>
            }) }
            <div className="button-row"><Button onClick={this.selectAllRights}>Select All Rights</Button></div>
            {/* <div className="form-group"><LawBrowserLink title="Companies Act 1993" location="s 36">Learn more about rights attached to shares</LawBrowserLink></div> */ }
            { fields.rights.map((n, i) => {
                return <Input key={i} type="textarea" rows="3" {...n} bsStyle={fieldStyle(n)} help={fieldHelp(n)} label="Describe Right" hasFeedback
                buttonAfter={<button className="btn btn-default" onClick={() => fields.rights.removeField(i)}><Glyphicon glyph='trash'/></button>}  />
            }) }

            <div className="form-group"><div className="button-row"><ButtonInput onClick={() => {
                fields.rights.addField();    // pushes empty child field onto the end of the array
            }}>Add Custom Right</ButtonInput></div></div>

            <div className="form-group">
                <label>{ STRINGS.shareClasses.transferRestrictionQuestion }</label>
                { this.props.companyState && <div>
                    <em>Note: This company { this.props.companyState.constitutionFiled ? 'has' : 'does not have'} a constitution. </em>
                    { constitutionDocument &&
                        <Link target="_blank" rel="noopener noreferrer" className="external-link" to={constitutionDocument.sourceUrl}>
                            View here <Glyphicon glyph="new-window"/>
                        </Link> }
                </div> }
            </div>

             <SelectBoolean {...fields.transferRestriction} bsStyle={fieldStyle(fields.transferRestriction)}
                    help={fieldHelp(fields.transferRestriction)}  hasFeedback >
                    <option value={false}>No</option>
                    <option value={true}>Yes</option>
            </SelectBoolean>

             { fields.transferRestriction.value &&
              <Input  {...fields.transferRestrictionDocument} bsStyle={fieldStyle(fields.transferRestrictionDocument)} className="combobox-wrapper"
                    help={fieldHelp(fields.transferRestrictionDocument)} label={STRINGS.shareClasses.transferRestrictionDocument} hasFeedback >
                        <Combobox value={fields.transferRestrictionDocument.value}
                        onChange={fields.transferRestrictionDocument.onChange}
                        data={transferRestrictionDocumentLocations}
                        onFocus={() => this.setState({showTransferRestriction: true})}
                        onBlur={() => this.setState({showTransferRestriction: false})}
                        open={this.state.showTransferRestriction}
                        onToggle={(show) => this.setState({showTransferRestriction: show})}
                        placeholder={STRINGS.shareClasses.transferRestrictionPlaceholder}
                        />
                    </Input>
                }

            { fields.limitations.map((n, i) => {
                return <Input key={i} type="textarea" rows="3" {...n} bsStyle={fieldStyle(n)} help={fieldHelp(n)} label="Limitation or Restriction" hasFeedback
                buttonAfter={<button className="btn btn-default" onClick={() => fields.limitations.removeField(i)}><Glyphicon glyph='trash'/></button>}  />
            }) }

            { fields.transferRestriction.value &&  <div className="form-group"><div className="button-row"><ButtonInput onClick={() => {
                fields.limitations.addField();    // pushes empty child field onto the end of the array
            }}>Add Limitation/Restriction</ButtonInput></div></div> }
            { !this.props.noDocuments && <Documents documents={fields.documents} label={STRINGS.shareClasses.documentsLabel} /> }


            </fieldset>
            <div className="button-row">
                { this.props.end &&  <ButtonInput onClick={() => this.props.end({cancelled: true})}>Cancel</ButtonInput> }
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
        return <ShareClassFormConnected {...this.props} />
    }
}

export class ShareClassEdit extends React.Component {
    render() {
        const state = this.props.shareClasses.filter(s => {
            return s.id.toString() === this.props.routeParams.shareClassId;
        })[0];
        if(!state){
            return <Loading />
        }
        return  <ShareClassFormConnected {...this.props} initialValues={{...state.properties, name: state.name, documents: state.documents}} edit={true} shareClassId={state.id}/>
    }
}


export class ShareClassCreateTransactionView extends React.Component {
    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'} lawLinks={shareClassLawLinks()}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Create Share Class</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                <ShareClassFormConnected {...this.props} {...this.props.transactionViewData} end={this.props.end} />
          </TransactionView.Body>
        </TransactionView>
    }
}


export class ShareClassEditTransactionView extends React.Component {
    render() {
        const state = this.props.transactionViewData.shareClasses.filter(s => {
            return s.id === this.props.transactionViewData.shareClassId;
        })[0];
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'} lawLinks={shareClassLawLinks()}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Create Share Class</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                    <ShareClassFormConnected {...this.props} {...this.props.transactionViewData} end={this.props.end}  initialValues={{...state.properties, name: state.name, documents: state.documents}} edit={true} shareClassId={state.id}/>
          </TransactionView.Body>
        </TransactionView>
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

function renderField(key, data, row, companyId) {
    switch(key){
        case 'limitations':
            return renderLimitations(row.properties.limitations);
        case 'transferRestriction':
            return row.properties.transferRestriction ? 'Yes' : 'No';
        case 'votingRights':
            return renderRights(row.properties.votingRights);
        case 'documents':
            return renderDocumentLinks(data || [], companyId)
        default:
            return data;
    }
}



export class ShareClassesTable extends React.Component {
    static fields = ['name', 'votingRights', 'transferRestriction', 'documents']

    renderList(data) {
        return <div>
            <table className="table table-hover table-striped share-class-table">
                <thead>
                <tr>{ ShareClassesTable.fields.map((f, i) => {
                    return <th key={i}>{STRINGS.shareClasses[f]._ || STRINGS.shareClasses[f]}</th>
                })}</tr>
                </thead>
                <tbody>
                    { data.map((row, i) => {
                        return <tr key={i} onClick={() => this.props.editShareClass(row.id)}>
                            { ShareClassesTable.fields.map((field, i) => {
                                return <td key={i}>{renderField(field, row[field], row, this.props.companyId)}</td>
                            }) }
                        </tr>
                    })}
                </tbody>
            </table>
            { this.props.navButton && <div className="button-row">
                <div><Link to={this.props.location.pathname +'/create'} className="btn btn-primary create-new">Create New Share Class</Link></div>
            </div> }

            { this.props.transactionViewButton && <div className="button-row">
               { this.props.end && <Button onClick={() => this.props.end({cancelled: true})}>Cancel</Button> }
               <Button bsStyle="primary" className="create-new" onClick={this.props.createTransactionView}>Create New Share Class</Button>
               { !!data.length && <Button bsStyle="success" onClick={this.props.end}>Finished Creating Share Classes</Button> }
            </div> }

        </div>
    }

    key() {
        return this.props.params.id
    };

    render() {
        const classes = ((this.props.companyState.shareClasses || {}).shareClasses || []);
        return <LawBrowserContainer lawLinks={shareClassLawLinks()}>
            <Widget title="Share Classes" bodyClass="share-classes">
                    { !this.props.children && this.renderList(classes) }
                     { this.props.children && React.cloneElement(this.props.children, {
                            companyId: this.key(),
                            companyState: this.props.companyState,
                            shareClasses: classes,
                            end: () => this.props.navigate(`/company/view/${this.key()}/share_classes`)
                    }) }
                     </Widget>
            </LawBrowserContainer>
        }
}

export const ShareClasses = connect(undefined, (dispatch, ownProps) => ({
    editShareClass: (id) => dispatch(push(`${ownProps.location.pathname}/view/${id}`)),
    navigate: (url) => dispatch(push(url))
}))((props) => <ShareClassesTable navButton={true} {...props} />)





export const ShareClassManageTransactionView  = (props) => {
    const shareClasses = (((props.transactionViewData.companyState || {}).shareClasses || {}).shareClasses || []);
    return <ShareClassesTable  {...props.transactionViewData}
    transactionViewButton={true}
    createTransactionView={() => props.show('createShareClass', {...props.transactionViewData, afterClose: {showTransactionView: {key: 'manageShareClasses', data: {loadCompanyState: true} }}  })}
    editShareClass={(id) => props.show('editShareClass', {...props.transactionViewData, shareClasses: shareClasses, shareClassId: id, afterClose: {showTransactionView: {key: 'manageShareClasses', data: {loadCompanyState: true} }}  })}
    end={props.end} />
};




