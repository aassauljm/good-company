"use strict";
import React from 'react';
import STRINGS from '../strings';
import LawBrowserContainer from './lawBrowserContainer'
import LawBrowserLink from './lawBrowserLink';
import { Link } from 'react-router';
import { AnnualReturnHOC,  AnnualReturnFromRouteHOC } from '../hoc/resources';
import { stringDateToFormattedString, numberWithCommas, formFieldProps, requireFields } from '../utils';
import { createResource, addNotification, showARInvite } from '../actions';
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

export const ARSummary = (props) => {
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
        this.props.showARInvite({arData: this.props.arSummary});
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
        </LawBrowserContainer>
            <ShowNext {...this.props} />
        </div>
    }
}