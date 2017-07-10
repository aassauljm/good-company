"use strict";
import React from 'react';
import STRINGS from '../strings';
import LawBrowserContainer from './lawBrowserContainer'
import LawBrowserLink from './lawBrowserLink';
import { Link } from 'react-router';
import { AnnualReturnHOC,  AnnualReturnFromRouteHOC, ARReviewHOC, ARConfirmationsHOC } from '../hoc/resources';
import { stringDateToFormattedString, numberWithCommas, formFieldProps, requireFields } from '../utils';
import { createResource, updateResource, deleteResource, addNotification, showARInvite, showARFeedback } from '../actions';
import moment from 'moment';
import Widget from './widget';
import Loading from './loading';
import Button from 'react-bootstrap/lib/Button';
import Input from './forms/input';
import Download from './forms/download';
import { PersonNameFull } from './forms/personName';
import { reduxForm } from 'redux-form';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { enums as ErrorTypes } from '../../../config/enums/errors';
import { ConnectCompaniesOffice } from './companiesOfficeIntegration';
import { CompaniesOfficeLink, UpdateSourceData } from './companiesRegister';
import { arDue } from './companyAlerts';
import { NextCompanyControls } from './guidedSetup';




function ARLinks() {
    return <div>
        <LawBrowserLink title="Companies Act 1993" location="s 214(1)+(6)+(7)">Board to file annual return</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 214(2)">Date of annual return</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 214(3)">Annual return to be signed</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 214(4),(5)">Annual return filing month</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 214(8),(9)">Special form of annual return</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 214(10) and 374(2)(23)">Consequences of non-compliance</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993 Regulations 1994" location="sch 1 cl 12">Form of annual return</LawBrowserLink>
        </div>
}

const ShowNext = (props) => {
    const showNext = props.location.query.show_next;

    if(showNext) {
        return <NextCompanyControls
            companyId={props.companyId}
            subPath={'annual_returns'}
            companyName={props.companyState.companyName}
            showSkip={!props.complete}
            verb='File annual return for'
            filter={a => a.deadlines.annualReturn && (a.deadlines.annualReturn.dueThisMonth || a.deadlines.annualReturn.overdue) }
            />
    }
    return null;
}


const DECLARATION = "I certify that the information contained in this annual return is correct.";

export class ARSummary extends React.PureComponent  {
    render() {
        const props = this.props;
        const leftColumn = 'col-xs-4 left';
        const rightColumn = 'col-xs-8 right';
        const row = "row";
        const titleRow = "row title-row";
        const condensedRow = "row";
        return <div className="annual-return">
                <h3 className="text-center">Annual Return</h3>

            <div className={ titleRow }>
                <div className={ leftColumn }>
                     Details
                </div>
            </div>

            <div className={ row }>
                <div className={ leftColumn }>
                    { STRINGS.companyName }
                </div>
                <div className={ rightColumn }>
                    { props.companyState.companyName }
                </div>
            </div>

            <div className={ row }>
                <div className={ leftColumn }>
                    { STRINGS.nzbn }
                </div>
                <div className={ rightColumn }>
                    { props.companyState.nzbn }
                </div>
            </div>

            <div className={ row }>
                <div className={ leftColumn }>
                    { STRINGS.effectiveDateString }
                </div>
                <div className={ rightColumn }>
                    { props.companyState.effectiveDate }
                </div>
            </div>

            <div className={ row }>
                <div className={ leftColumn }>
                    Filing Year
                </div>
                <div className={ rightColumn }>
                    { props.companyState.companyFilingYear }
                </div>
            </div>

            <div className={ row }>
                <div className={ leftColumn }>
                     { STRINGS.ultimateHoldingCompany }
                </div>
                <div className={ rightColumn }>
                    { props.companyState.ultimateHoldingCompany ? 'Yes' : 'No' }
                </div>
            </div>

            <div className={ titleRow }>
                <div className={ leftColumn }>
                     Required Addresses
                </div>
            </div>

            <div className={ row }>
                <div className={ leftColumn }>
                     { STRINGS.registeredCompanyAddress }
                </div>
                <div className={ rightColumn }>
                    { props.companyState.registeredCompanyAddress }
                </div>
            </div>

            <div className={ row }>
                <div className={ leftColumn }>
                     { STRINGS.addressForService }
                </div>
                <div className={ rightColumn }>
                    { props.companyState.addressForService }
                </div>
            </div>

            { /* <div className={ titleRow }>
                <div className={ leftColumn }>
                     Optional Addresses
                </div>
            </div>

            <div className={ row }>
                <div className={ leftColumn }>
                     { STRINGS.addressForShareRegister}
                </div>
                <div className={ rightColumn }>
                    { props.companyState.addressForShareRegister }
                </div>
            </div> */ }
            <hr/>
            <div className={ titleRow }>
                <div className={ leftColumn }>
                     Directors
                </div>
            </div>

            { props.companyState.directorList.directors.map((director, i) => {
                return <div key={i}>
                    <div className={ condensedRow }>
                        <div className={ leftColumn }>
                             Full Legal Name
                        </div>
                        <div className={ rightColumn }>
                            { director.person.name }
                        </div>
                    </div>
                    <div className={ condensedRow }>
                        <div className={ leftColumn }>
                             Residential Address
                        </div>
                        <div className={ rightColumn }>
                            { director.person.address }
                        </div>
                    </div>
                    <div className={ condensedRow }>
                        <div className={ leftColumn }>
                             Appointment Date
                        </div>
                        <div className={ rightColumn }>
                            { stringDateToFormattedString(director.appointment) }
                        </div>
                    </div>
                            <hr/>
                </div>
            })}

            <div className={ titleRow }>
                <div className={ leftColumn }>
                     Shareholdings
                </div>
            </div>

            <div className={ row }>
                <div className={ leftColumn }>
                     Total Number of Shares
                </div>
                <div className={ rightColumn }>
                   { numberWithCommas(props.companyState.holdingList.holdings.reduce((sum, h) => {
                        return sum + h.parcels[0].amount
                   }, 0))}
                </div>


            </div>

            <hr/>

            { props.companyState.holdingList.holdings.map((holding, i) => {
                return <div key={i}>
                    <div className={ row }>
                        <div className={ leftColumn }>
                             { numberWithCommas(holding.parcels[0].amount) } Shares
                        </div>
                        <div className={ rightColumn }>
                            { holding.holders.map((holder, j) => {
                                return <div key={j}>
                                <div className="name">{ holder.person.name }</div>
                                <div>{ holder.person.address }</div>
                                </div>
                            })}
                        </div>
                    </div>
                    <hr/>
                </div>
            })}

        </div>
    }
}

@AnnualReturnFromRouteHOC(true)
export class AnnualReturnLoader extends React.Component {
    render() {
        if(this.props.arSummary && this.props.arSummary.data) {
            return <div className="container annual-return-document">
                <ARSummary companyState={this.props.arSummary.data} />
                </div>
        }
        return null;
    }
}


@AnnualReturnHOC(false, true)
@reduxForm({
    fields: ['confirm'],
    form: 'confirmAR'
})
@connect(undefined, {
    showARInvite: (args) => showARInvite(args)
})
export class ReviewAnnualReturn extends React.PureComponent {

    constructor(props) {
        super(props);
        this.submit = ::this.submit;
        this.invite = ::this.invite
    }


    renderSubmitControls() {
        const { fields: {confirm} } = this.props;
        const deadline = arDue(this.props.companyState.deadlines);
        const ready = deadline &&  this.props.arSummary && this.props.arSummary.data;

        return  <div>
                <div className="button-row">
                    { ready && <Input type="checkbox" {...confirm} label={DECLARATION} /> }
                </div>
                <div className="button-row">
                    { ready && <Button  bsStyle="info" onClick={this.invite} >Invite others to Review</Button> }
                    { ready && <Button className="confirm" bsStyle="success" onClick={() => this.submit(this.props.arSummary.data.etag)} disabled={!confirm.value}>Continue with Submission</Button> }
                </div>
            { !deadline && <div className="alert alert-warning">Annual Return is not due</div> }
            </div>

    }


    renderControls() {
        return  this.renderSubmitControls();

    }

    submit(etag) {
        this.props.push({
                pathname: `/company/view/${this.props.companyId}/ar_details/${etag}`,
                query: this.props.location.query
            })
    }

    invite() {
        this.props.showARInvite({arData: this.props.arSummary.data, companyId: this.props.companyId});
    }


    renderError() {
        return <div>
            <div className="alert alert-danger">
                { this.props.arSummary.error.message }
            </div>
            { this.props.arSummary.error.errorCode === ErrorTypes.USER_NOT_CONNECTED  && <div className="button-row">
                <a className="btn btn-info" href="/api/auth-with/companies-office?redirect=true">Connect with Companies Office</a>
            </div>}
            </div>
    }

    renderWarning() {
        return <div>
            <div className="alert alert-warning">
                If the details below are incorrect, please update them at the <CompaniesOfficeLink companyNumber={this.props.companyState.companyNumber} text="Companies Office website"/>.
                Automated updates from Good Companies to the Companies Office will be released shortly.
                <DirectDebit />
            </div>
        </div>
    }

    renderLoading() {
        return <div>
                <p className="text-center">
                    Fetching Annual Return data from the Companies Office
                </p>
                <Loading />
            </div>
    }

    render() {
        return <div><LawBrowserContainer lawLinks={ARLinks()}>
                        <AnnualReturnConfirmations companyId={this.props.companyId}/>
              <Widget className="ar-review" title="Review Annual Return">
                    { this.renderWarning()  }
                    { this.props.arSummary && this.props.arSummary._status === 'complete' && this.props.arSummary.data && <Download url={`/api/company/render/${this.props.companyId}/annual_return`} /> }
                    { this.props.arSummary && this.props.arSummary._status === 'complete' && this.props.arSummary.data && <ARSummary companyState={this.props.arSummary.data} /> }
                    { this.props.arSummary && this.props.arSummary._status === 'fetching' && this.renderLoading() }
                    { this.props.arSummary && this.props.arSummary._status === 'error' && this.renderError() }
                    { this.renderControls() }
                    </Widget>

        </LawBrowserContainer>
           <ShowNext {...this.props} />
        </div>
    }
}


const FIELDS = [
        'designation',
        'email',
        //'name.title',
        'name.firstName',
        'name.middleNames',
        'name.lastName',
        //'phone.number',
        //'phone.purpose',
        //'phone.areaCode',
        //'phone.countryCode'
        ];

const baseValidate =  requireFields('designation');
const nameValidate = requireFields('firstName', 'lastName');

@reduxForm({
    fields: FIELDS,
    form: 'arSubmission',
    validate: (values) => {
        const errors = baseValidate(values);
        errors.name = nameValidate(values.name);
        return errors;
    }
})
@formFieldProps({
    labelClassName: 'col-md-3',
    wrapperClassName: 'col-md-9'
})
export class AnnualReturnSubmissionForm extends React.PureComponent {

    render() {
        return <form className="form form-horizontal"  onSubmit={this.props.handleSubmit}>
                    <div className="form-group">
                    <div className="control-label col-md-3">
                    <label>{ STRINGS.annualReturns.fullName}</label>
                    </div>
                    <div className="col-md-9">
                        <div className="col-xs-12">
                        <PersonNameFull {...this.props.fields.name} />
                        </div>
                    </div>
                    </div>
                    <Input type="select" {...this.formFieldProps('designation', STRINGS.annualReturns)} >
                         <option value="" disabled>Please select...</option>
                        <option value="Authorised Person">Authorised Person</option>
                        <option value="Director">Director</option>
                    </Input>
                    <Input type="email" {...this.formFieldProps('email', STRINGS.annualReturns)} />
                    <div className="button-row">
                    <Link className="btn btn-default" to={`/company/view/${this.props.companyId}/review_annual_return`}>Back</Link>
                        <Button type="submit" bsStyle="primary">Submit Annual Return</Button>
                    </div>
                </form>
    }
}

const DirectDebit = () => {
    return <p>You also must have set up a direct debit with the Companies Office.  <a href="https://www.companiesoffice.govt.nz/companies/learn-about/create-manage-logon/payment-options#establish-dd" className="external-link" target="_blank">Click here to learn more.</a> </p>;
}

@connect((state, ownProps) => ({
    userInfo: state.userInfo,
    arSubmitRequest: state.resources[`/company/${ownProps.companyId}/ar_submit`]
}), {
    submitAR: (url, data) => createResource(url, data, {
        confirmation: {
            title: 'Confirm Annual Return Submission',
            description: 'If submission is successful, the annual return filing fee will be charged to your direct debit account',
            resolveMessage: 'Confirm Submission',
            resolveBsStyle: 'danger'
        },
        loadingMessage: 'Submitting Annual Return'
    }),
    addNotification: (...args) => addNotification(...args)
})
export class AnnualReturnSubmission extends React.PureComponent {
    constructor(props) {
        super(props);
        this.submit = ::this.submit;
    }

    submit(values) {
        const url = `/company/${this.props.companyId}/ar_submit`;
        return this.props.submitAR(url, {
            designation: values.designation,
            name: values.name,
            "emailAddress": {
                "emailPurpose": "Email",
                "emailAddress": values.email
            },
            declaration: DECLARATION,
            companyDetailsConfirmedCorrectAsOfETag: this.props.params.etag
        })
        .then(() => {
            this.props.addNotification({message: 'Annual Return Submitted'})
            this.props.push({
                pathname: `/company/view/${this.props.companyId}/annual_return_submitted`,
                query: this.props.location.query
            })
        })
    }

    error() {
        if(this.props.arSubmitRequest && this.props.arSubmitRequest._status === 'error'){
            return <div className="alert alert-danger">
                { this.props.arSubmitRequest.error.message }
            </div>
        }
    }

    render() {

        return <div><LawBrowserContainer lawLinks={ARLinks()}>
              <Widget className="ar-review-form" title="Review Annual Return">
                { this.error() }
                <AnnualReturnSubmissionForm initialValues={{email: this.props.userInfo.email}} onSubmit={this.submit} companyId={this.props.companyId}/>
            </Widget>
        </LawBrowserContainer>
           <ShowNext {...this.props} />
           </div>
    }
}

export class AnnualReturnSubmitted extends React.PureComponent {
    render() {

        return <div><LawBrowserContainer lawLinks={ARLinks()}>
              <Widget className="ar-success" title="Annual Return Submitted">
              <p>Congratulations, the annual return for {this.props.companyState.companyName} has been submitted.</p>
              <div className="button-row">
                    <Link className="btn btn-info" to={{pathname: `/company/view/${this.props.companyId}`}}>View Company</Link>
              </div>
            </Widget>
        </LawBrowserContainer>
           <ShowNext {...this.props} />
           </div>
    }
}



@connect(undefined, {
    showARFeedback: (...args) => showARFeedback(...args),
    updateARConfirmation: (...args) => updateResource(...args),
    revokeAR: (companyId, code) => deleteResource(`/company/${companyId}/ar_confirmation/${code}`, {confirmation: {
            title: 'Confirm Revocation',
            description: 'This will expire the link sent to this person, preventing them from viewing the annual return.',
            resolveMessage: 'Confirm Revocation',
            resolveBsStyle: 'danger'
        }})
})
export class AnnualReturnConfirmationStatus extends React.PureComponent {
    constructor(props) {
        super(props);
        this.showFeedback = ::this.showFeedback;
        this.revoke = ::this.revoke;
        this.confirm = ::this.confirm;
        this.unConfirm = ::this.unConfirm;
    }

    confirm() {
        this.props.updateARConfirmation(`/ar_confirmation/${this.props.arRequest.code}`, {confirmed: true})
    }

    unConfirm() {
        this.props.updateARConfirmation(`/ar_confirmation/${this.props.arRequest.code}`, {confirmed: false})
    }

    showFeedback() {
        this.props.showARFeedback(this.props.arRequest)
    }

    revoke() {
        this.props.revokeAR(this.props.companyId, this.props.arRequest.code)
    }

    render() {
        return <tr>
            <td>
                { this.props.arRequest.name }
            </td>
            <td>
                { this.props.arRequest.email }
            </td>
            <td>
            { this.props.arRequest.confirmed && <strong className="text-success">Confirmed</strong>}
            { this.props.arRequest.feedback && !this.props.arRequest.confirmed && <strong className="text-danger">Has Feedback</strong>}
            { !this.props.arRequest.confirmed && !this.props.arRequest.feedback && <strong className="text-warning">Pending</strong>}
            </td>
            <td>
            { this.props.arRequest.feedback && !this.props.arRequest.confirmed && <a href="#" className="vanity-link" onClick={this.showFeedback}>View</a>}
            { !this.props.arRequest.confirmed && !this.props.arRequest.feedback && <a href="#" className="vanity-link" onClick={this.revoke}>Revoke Invitation</a>}
            </td>
            <td>
            { this.props.arRequest.confirmed  && <a href="#" className="vanity-link" onClick={this.unConfirm}>Mark as Unconfirmed</a>}
            { !this.props.arRequest.confirmed  && <a href="#" className="vanity-link" onClick={this.confirm}>Mark as Confirmed</a>}
            </td>
        </tr>
    }
}

@connect(undefined, {
    showARInvite: (args) => showARInvite(args)
})
@ARConfirmationsHOC()
export class AnnualReturnConfirmations extends React.PureComponent {
    constructor(props) {
        super(props);
        this.invite = ::this.invite;
    }
    invite() {
        this.props.showARInvite({arData: this.props.arConfirmations.data.arData, companyId: this.props.companyId});
    }
    render() {
        if(this.props.arConfirmations && this.props.arConfirmations.data){
            return <Widget title="Annual Return Confirmations">
                <div className="table-responsive">
                <table className="table table-striped">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th colSpan="2">Actions</th>
                </tr>
                </thead>
                <tbody>
                { this.props.arConfirmations.data.arConfirmationRequests.map((r, i) => {
                    return <AnnualReturnConfirmationStatus key={i} arRequest={r} companyId={this.props.companyId}/>
                }) }
                </tbody>
                </table>
                </div>
                <div className="button-row">
                    <Button  bsStyle="info" onClick={this.invite} >Invite others to Review</Button>
                </div>
            </Widget>
        }
        return false;
    }
}


export function AnnualReturnConfirmation(props) {
    return <AnnualReturnConfirmationPage code={props.params.code} />
}


@reduxForm({
    fields: ['requiresCorrections', 'feedback'],
    form: 'confirmAR'
})
export class AnnualReturnConfirmationForm extends React.PureComponent {
    constructor(props) {
        super(props);
        this.submitFeedback = ::this.submitFeedback;
        this.submitConfirm = ::this.submitConfirm;
        if(typeof document !== 'undefined'){
            this.quill = require('react-quill');
        }
    }

    submitConfirm() {
        this.props.submit({confirmed: true, feedback: null})
    }

    submitFeedback() {
        const { feedback } = this.props.fields;
        if(feedback.value){
            this.props.submit({confirmed: false, feedback: feedback.value});
        }
    }

    render() {
        const { requiresCorrections, feedback } = this.props.fields;
        const Quill = this.quill;
        return <div>
                <div className="text-center">
                    { <Input type="checkbox" {...requiresCorrections} label={'Requires Corrections'} /> }
                </div>
                { !requiresCorrections.value && <div className="button-row">
                    <Button className="confirm" bsStyle="success"onClick={this.submitConfirm} >Confirm Annual Return</Button>
                </div> }
                { requiresCorrections.value && <div className="text-center">
                <p><strong>Please describe corrections to be made</strong></p>
                </div>}
                { requiresCorrections.value && Quill && <Quill {...feedback} /> }
                { requiresCorrections.value && !Quill && <Input type="textarea" {...feedback} /> }
                { requiresCorrections.value && <div className="button-row">
                    <Button  bsStyle="warning" disabled={!feedback.value} onClick={this.submitFeedback} >Confirm with Corrections</Button>
                </div> }

            </div>
        }
}

@connect(undefined, {
    updateARConfirmation: (...args) => updateResource(...args),
    addNotification: (...args) => addNotification(...args)
})
export class AnnualReturnConfirmationSummaryAndForm extends React.PureComponent {
    constructor(props) {
        super(props);
        this.submit = ::this.submit;
    }

    submit(values) {
        this.props.updateARConfirmation(`/ar_confirmation/${this.props.code}`, values)
        .then((response) => {
            this.props.addNotification({message: response.response.message})
        })
        .catch(() => {
            this.props.addNotification({message: 'Sorry, unable to submit at this time', error: true})
        })
    }

    render() {
        const inviter = this.props.arConfirmation.user.username;
        const invitee = this.props.name;
        const submitted = !!this.props.confirmed || this.props.feedback;
        return <div>
            <div className="alert alert-success">
            <p>Hello { invitee }</p>
            <p><strong>{ inviter }</strong> has requested you review the annual return for <strong>{ this.props.arConfirmation.arData.companyName }</strong>.</p>
            <p>If you are happy with the details, please click the <strong>Confirm Annual Return</strong> button, otherwise check the <strong>Requires Corrections</strong> checkbox and give feedback.</p>
            </div>
             { submitted && <div className="alert alert-warning">
             <p><strong>{ inviter }</strong> has been notified of your { this.props.confirmed ? 'confirmation' : 'feedback' }, but you can still make further changes if you require.</p>
             </div> }
            <ARSummary companyState={this.props.arConfirmation.arData} />
            <AnnualReturnConfirmationForm submit={this.submit} initialValues={{requiresCorrections: !!this.props.feedback, feedback: this.props.feedback}}/>
        </div>
    }
}

@ARReviewHOC(true)
export class AnnualReturnConfirmationPage extends React.PureComponent {
    renderError() {
        return  <div className="alert alert-danger">
                We are sorry, it appears that this link has expired.
            </div>
    }

    render() {
        const arConfirmation = this.props.arConfirmation;
        return <div><LawBrowserContainer lawLinks={ARLinks()}>
              <Widget className="ar-success" title="Review Annual Return">
                { arConfirmation ._status === 'fetching' && <Loading /> }
                { arConfirmation ._status === 'error' && this.renderError() }
                { arConfirmation ._status === 'complete' && <AnnualReturnConfirmationSummaryAndForm {...arConfirmation.data} /> }
            </Widget>
        </LawBrowserContainer>
           </div>
    }
}



@connect(state => ({userInfo: state.userInfo}))
export default class AnnualReturn extends React.PureComponent {
    render() {
        const hasCompaniesOfficeIntegration = this.props.userInfo.mbieServices.indexOf('companies-office') >= 0;
        const due = arDue(this.props.companyState.deadlines);
        return <div>
            <LawBrowserContainer lawLinks={ARLinks()}>
            <Widget className="ar-info" title="Annual Return">

                { !due && <div className="alert alert-warning">According to our records, the annual return for this company is not yet due.</div> }
                <p>If you have connected your RealMe with the Companies Office, and you have authourity over this company, you can submit an Annual Return.  </p>
                <DirectDebit />
                <p>If you have already submitted an annual return independently, please click 'Check for Updates' below to update our records.</p>
                { hasCompaniesOfficeIntegration && <div><p>Click the button below to generate an annual return for review and submission.</p>
                    <div className="button-row">
                        <UpdateSourceData companyId={this.props.companyId} />
                        <Link to={{pathname: `/company/view/${this.props.companyId}/review_annual_return`, query: this.props.location.query}} className="btn btn-primary">Show Annual Return</Link>
                        </div>
                </div> }
                { !hasCompaniesOfficeIntegration && <ConnectCompaniesOffice redirect={true} >
                    <UpdateSourceData companyId={this.props.companyId} />
                </ConnectCompaniesOffice> }
            </Widget>
        <AnnualReturnConfirmations companyId={this.props.companyId}/>
        </LawBrowserContainer>
        <ShowNext {...this.props} />
        </div>
    }
}