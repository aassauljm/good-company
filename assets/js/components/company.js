"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import { requestResource, changeCompanyTab, showTransactionView, toggleWidget, resetTransactionViews, showBillingIssue} from '../actions';
import { pureRender, numberWithCommas, stringDateToFormattedString, analyseCompan, resourceIsForbidden } from '../utils';
import { connect } from 'react-redux';
import ButtonInput from './forms/buttonInput';
import CompanyHeader from  './companyHeader';
import { Link } from 'react-router';
import Panel from './panel';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import STRINGS from '../strings';
import LawBrowserLink from './lawBrowserLink'
import { asyncConnect } from 'redux-connect';
import { ShareholdingsWidget } from './shareholdings';
import { RecentCompanyActivityWidget } from './recentActivity';
import { CompaniesRegisterWidget } from './companiesRegister';
import { ContactDetailsWidget } from './contactDetails';
import { AccessListWidget } from './accessList';
import { DirectorsWidget } from './directors';
import { DocumentsWidget } from './documents';
import { ReportingDetailsWidget } from './reportingDetails';
import { TransactionWidget, PendingTransactionsWidget } from './transactions';
import NotFound from './notFound';
import Forbidden from './forbidden';
import { push } from 'react-router-redux'
import Header from './header';
import { CompanyAlertsWidget } from './companyAlerts';
import moment from 'moment';
import { destroy as destroyForm } from 'redux-form';
import { CompanyFromRouteHOC, CompanyDatedHOCFromRoute } from '../hoc/resources';


const DEFAULT_OBJ = {};


const FAKE_COMPANY = {
    holdingList: {holdings: []}, warnings: {}, deadlines: {},
    FAKE: true
};



@CompanyFromRouteHOC(true)
export default class Company extends React.Component {
    render() {
        const loc = '/company/'+this.props.params.id +'/get_info';
        const baseUrl = `/company/view/${this.props.params.id}`
        return <CompanyView {...this.props} data={DEFAULT_OBJ} {...this.props[loc]}  baseUrl={baseUrl}/>
    }
}


@CompanyDatedHOCFromRoute(true)
export class CompanyDated extends React.Component {
    render() {
        const loc = '/company/'+this.props.params.id +'/at_date/'+this.props.params.date;
        const baseUrl = `/company/at_date/${this.props.params.date}/view/${this.props.params.id}`;
        const date = moment(this.props.params.date, 'D-M-YYYY').toDate()
        return <CompanyView {...this.props} data={DEFAULT_OBJ} {...this.props[loc]} date={date} baseUrl={baseUrl} />
    }
}



@connect((state, ownProps) => {
    return {
        companyPage: state.companyPage,
        widgets: state.widgets[ownProps.params.id] || DEFAULT_OBJ,
        transactionViews: state.transactionViews,
        login: state.login,
        userInfo: state.userInfo
    };
},
(dispatch, ownProps) => ({
    showTransactionView: (key, data) => { dispatch(push(`/company/view/${ownProps.params.id}/new_transaction`)); dispatch(showTransactionView(key, data)) },
    toggleWidget: (path, args) => dispatch(toggleWidget(path, args)),
    destroyForm: (args) => dispatch(destroyForm(args)),
    showBillingIssue: (...args) => dispatch(showBillingIssue(...args)),
    push: (url) => dispatch(push(url))
}))
export class CompanyView extends React.Component {
    static propTypes = {
        companyPage: PropTypes.object.isRequired,
        data: PropTypes.object.isRequired
    };

    constructor(props) {
        super(props);
        this.billingIssue = ::this.billingIssue;
    }

    billingIssue() {
        const data = this.props.data || DEFAULT_OBJ;
        const suspended = data.suspended;
        const current = data.currentCompanyState || data.companyState;
        this.props.showBillingIssue({
            companyName: current.companyName,
            owner: data.owner,
            selfOwned: this.props.userInfo.id === data.ownerId,
            userInfo: this.props.userInfo,
            upgradeUrl: `${this.props.login.userUrl}/my-services?Good%2BCompanies=1`
        })
    }

    key() {
        return this.props.params.id
    }

    canViewAlerts(permissions) {
        return (permissions || []).indexOf('update') >= 0;
    }
    canUpdate(current) {
        return (current.permissions || []).indexOf('update') >= 0;
    }
    renderBody(current) {
        if(!current){
             return <div className="loading"> <Glyphicon glyph="refresh" className="spin"/></div>
        }

        else if(this.props.children){
            return React.cloneElement(this.props.children, {
                        companyState: current,
                        companyId: this.key(),
                        push: this.props.push,
                        baseUrl: this.props.baseUrl,
                        destroyForm: this.props.destroyForm,
                        owner: this.props.data.owner,
                        canUpdate: this.canUpdate(current),
                        showTransactionView: (key, data) => this.props.showTransactionView(key, data)
                });
        }
        else{
            return <div className="container">
            <div className="row ">
                 <div className="col-md-6">

                     { this.canViewAlerts(current.permissions) && <CompanyAlertsWidget
                        companyState={current}
                        companyId={this.props.params.id}
                        baseUrl={this.props.baseUrl}
                     /> }


                    <CompaniesRegisterWidget
                        toggle={(expanded) => this.props.toggleWidget([this.key(), 'companiesRegister'], expanded) }
                        expanded={(this.props.widgets.companiesRegister || {}).expanded}
                        companyState={current}
                        companyId={this.props.params.id}
                        baseUrl={this.props.baseUrl}
                     />


                    <DocumentsWidget
                        toggle={(expanded) => this.props.toggleWidget([this.key(), 'documents'], expanded) }
                        expanded={(this.props.widgets.documents || {}).expanded}
                        companyState={current}
                        companyId={this.props.params.id}
                        baseUrl={this.props.baseUrl}
                     />
                    { /* <ReportingDetailsWidget
                        toggle={(expanded) => this.props.toggleWidget([this.key(), 'reporting'], expanded) }
                        expanded={(this.props.widgets.reporting || {}).expanded}
                        companyState={current}
                        companyId={this.props.params.id}
                     /> */ }
                    <PendingTransactionsWidget
                        toggle={(expanded) => this.props.toggleWidget([this.key(), 'pendingTransactions'], expanded) }
                        expanded={(this.props.widgets.pendingTransactions || {}).expanded}
                        companyState={current}
                        companyId={this.props.params.id}
                        baseUrl={this.props.baseUrl}
                     />

                    <TransactionWidget
                        toggle={(expanded) => this.props.toggleWidget([this.key(), 'transactions'], expanded) }
                        expanded={(this.props.widgets.transactions || {}).expanded}
                        companyState={current}
                        companyId={this.props.params.id}
                        baseUrl={this.props.baseUrl}
                     />
                     <RecentCompanyActivityWidget
                        toggle={(expanded) => this.props.toggleWidget([this.key(), 'recentActivity'], expanded) }
                        expanded={(this.props.widgets.recentActivity || {}).expanded}
                        companyState={current}
                        companyId={this.props.params.id}
                        baseUrl={this.props.baseUrl}
                     />
                </div>
                 <div className="col-md-6">
                     <ShareholdingsWidget
                        //toggle={(expanded) => this.props.toggleWidget([this.key(), 'shareholdings'], expanded) }
                        expanded={true}
                        companyState={current}
                        companyId={this.props.params.id}
                        baseUrl={this.props.baseUrl}
                     />

                    <ContactDetailsWidget
                        toggle={(expanded) => this.props.toggleWidget([this.key(), 'companiesRegister'], expanded) }
                        expanded={(this.props.widgets.companiesRegister || {}).expanded}
                        companyState={current}
                        companyId={this.props.params.id}
                        baseUrl={this.props.baseUrl}
                     />
                    <DirectorsWidget
                        toggle={(expanded) => this.props.toggleWidget([this.key(), 'directors'], expanded) }
                        expanded={(this.props.widgets.directors || {}).expanded}
                        companyState={current}
                        companyId={this.props.params.id}
                        baseUrl={this.props.baseUrl}
                     />

                    { this.canUpdate(current) && <AccessListWidget
                        toggle={(expanded) => this.props.toggleWidget([this.key(), 'accessList'], expanded) }
                        expanded={(this.props.widgets.accessList || {}).expanded}
                        companyState={current}
                        companyId={this.props.params.id}
                        baseUrl={this.props.baseUrl}
                        owner={this.props.data.owner}
                     /> }

                </div>

                </div>
            </div>
        }
    }

    render(){
        const data = this.props.data || DEFAULT_OBJ;
        const suspended = data.suspended;
        const deleted = data.deleted;
        const current = data.currentCompanyState || data.companyState;

        if(this.props._status === 'error'){
            if(resourceIsForbidden(this.props.error)){
                return <Forbidden descriptor="Company" />
            }
            return <NotFound descriptor="Company" />
        }
        return <div className="company">

                <div className={current ? "company-page company-loaded" : "company-page"}>
                    <div className="container-fluid page-top">
                        <CompanyHeader companyId={this.key()} companyState={current || DEFAULT_OBJ} baseUrl={this.props.baseUrl} date={this.props.date} />
                        </div>
                      { suspended && <div className="container-fluid">
                       { <div className="container"><div className="alert alert-danger suspend-info">
                            This Company has been suspended, pending an update of billing information. <a className="vanity-link" onClick={this.billingIssue}>Click here to find out more</a> </div> </div> }
                    </div>}

                      { deleted && <div className="container-fluid">
                       { <div className="container"><div className="alert alert-danger suspend-info">
                            This Company has been deleted </div> </div> }
                    </div>}

                    <div className={"container-fluid page-body " + ((suspended || deleted) ? 'suspended ' : '')}>
                        { this.renderBody(current || FAKE_COMPANY, suspended) }
                    </div>
            </div>
            <Link to={`/company/view/${this.props.params.id}/graph`} className="fa fa-pie-chart graph-link" />
        </div>
    }
}
