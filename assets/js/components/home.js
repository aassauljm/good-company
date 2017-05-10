"use strict";
import React from 'react';
import { pureRender,  debounce } from '../utils';
import { lookupCompany, lookupOwnCompany } from '../actions';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { push } from 'react-router-redux';
import { Link } from 'react-router';
import { showTransactionView } from '../actions';
import { RecentActivityWidget } from './recentActivity';
import { AlertsWidget } from './alerts';
import { CompaniesWidget } from './companies';
import { TemplateWidget } from './templates';
import { CalendarWidget } from './calendar';
import { AsyncHOCFactory, EVENTS, RECENT_ACTIVITY, COMPANIES, ALERTS } from '../hoc/resources';
import { HeaderSubControls } from './header';
import { ImportSingleWidget } from './importMenu'
import { OrganisationWidget } from './accessList'
import { CompaniesOfficeIntegrationWidget } from './companiesOfficeIntegration'
import ErrorPage from './error';
import ChangeLog from './changeLog';


@AsyncHOCFactory([COMPANIES])
@connect(state => ({ userInfo: state.userInfo, login: state.login}))
export class LandingPageView extends React.PureComponent {

    welcomeBack() {
        if (this.props.userInfo.lastLogin === 'first log in') {
            return  (
                <div className="welcome-back">
                    Hello <strong>{ this.props.userInfo.username }</strong>, welcome to Good Companies
                </div>
            );
        }

        return (
            <div className="welcome-back">
                Hello <strong>{ this.props.userInfo.username }</strong>, you last logged in {this.props.userInfo.lastLogin}
            </div>
        );
    }

    gettingStarted() {
        return  <div className="welcome-back">
            Welcome <strong>{ this.props.userInfo.username }</strong>, click <Link className="vanity-link" to='/import' >here</Link> to import a company and get started with Good Companies
        </div>
    }

   freeUser() {
        return  <div className="welcome-back">
            Welcome <strong>{ this.props.userInfo.username }</strong><br/>To import and manage your own companies, click <a className="vanity-link" href={`${this.props.login.userUrl}/my-services?Good%2BCompanies=1`} >here</a> to upgrade your account.
        </div>
    }

    banner() {
        const canImport = this.props.userInfo.permissions.company.indexOf('create') >= 0;
        const noCompanies = this.props.companies._status === 'complete' && this.props.companies.data.filter(d => !d.deleted).length === 0;
        if(noCompanies && canImport){
            return this.gettingStarted();
        }
        else if(!canImport){
            return this.freeUser();
        }
        else{
            return this.welcomeBack();
        }
    }

    render() {
        const errorType = this.props.location.query['error'];
        if(this.props.routes.some(r => r.childrenOnly)){
            return this.props.children
        }


        return  <div>
            <div className="container-fluid page-top">
                <div className="container">
                    { this.banner() }
                </div>
            </div>
                <div className="container-fluid page-body">
                      { errorType && <ErrorPage type={errorType} /> }
                        { this.props.children }
                </div>
        </div>
    }
}


@AsyncHOCFactory([COMPANIES, ALERTS, EVENTS, RECENT_ACTIVITY])
@connect(state => ({ userInfo: state.userInfo, login: state.login}))
export default class Home extends React.PureComponent {
    render() {
        const org = ((this.props.userInfo || {}).organisation);
        const canImport = this.props.userInfo.permissions.company.indexOf('create') >= 0;
        const canCreateEvent = this.props.userInfo.permissions.event.indexOf('create') >= 0;
        const subscribed = this.props.userInfo.roles.find(r => r.name === 'subscribed');
        const orgAdmin = org && org.find(o => o.userId === this.props.userInfo.id).roles.indexOf('organisation_admin') >= 0;
        const showImport = canImport || (!org && !subscribed) || (!subscribed && orgAdmin)
        // show import with warning, if
        // (non org member, and nonsubscribed) OR (org admin, and nonsubscribed)

        return <div className="container">
                <div className="row">
                    <div className="col-md-6">
                        <CalendarWidget canCreateEvent={canCreateEvent}/>
                        <CompaniesWidget />
                        <TemplateWidget />

                    </div>
                    <div className="col-md-6">
                        <ChangeLog />
                        { showImport && <ImportSingleWidget canImport={canImport} upgradeUrl={`${this.props.login.userUrl}/my-services?Good%2BCompanies=1`}/> }
                        <CompaniesOfficeIntegrationWidget />
                        <AlertsWidget />
                        <RecentActivityWidget />

                        { org && <OrganisationWidget /> }
                    </div>
                </div>
            </div>
    }
}

