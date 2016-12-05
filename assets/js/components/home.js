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
import { FavouritesWidget } from './favourites';
import { CompaniesWidget } from './companies';
import { TemplateWidget } from './templates';
import { CalendarWidget } from './calendar';
import { AsyncHOCFactory, EVENTS, RECENT_ACTIVITY, COMPANIES, ALERTS, FAVOURITES } from '../hoc/resources';
import { HeaderSubControls } from './header';
import { ImportSingleWidget } from './importMenu'

@AsyncHOCFactory([COMPANIES])
@connect(state => ({ userInfo: state.userInfo}))
export class LandingPageView extends React.Component {

    welcomeBack() {
        if(this.props.userInfo.lastLogin === 'first log in'){
            return  <div className="welcome-back">
                 Hello <strong>{ this.props.userInfo.username }</strong>, welcome to Good Companies
                </div>
        }
        return  <div className="welcome-back">
             Hello <strong>{ this.props.userInfo.username }</strong>, you last logged in {this.props.userInfo.lastLogin}
            </div>
    }

    gettingStarted() {
        return  <div className="welcome-back">
            Welcome <strong>{ this.props.userInfo.username }</strong>, click <Link className="vanity-link" to='/import' >here</Link> to import a company and get started with Good Companies
        </div>
    }

    render() {
        //
        const noCompanies = this.props.companies._status === 'complete' && this.props.companies.data.filter(d => !d.deleted).length === 0;
        return  <div>
            <div className="container-fluid page-top">
                <div className="container">
                { !noCompanies && this.welcomeBack() }
                { noCompanies && this.gettingStarted() }
                </div>
            </div>
                <div className="container-fluid page-body">
                        { this.props.children }
                </div>
        </div>
    }
}


@AsyncHOCFactory([COMPANIES, FAVOURITES, ALERTS, EVENTS, RECENT_ACTIVITY])
export default class Home extends React.Component {
    render() {
        return <div className="container">
                <div className="row">
                    <div className="col-md-6">
                        <CalendarWidget />
                        <CompaniesWidget />
                        <TemplateWidget />
                    </div>
                    <div className="col-md-6">
                        <ImportSingleWidget />
                        <AlertsWidget />
                        <FavouritesWidget />
                        <RecentActivityWidget />
                    </div>
                </div>
            </div>
    }
}

