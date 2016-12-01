"use strict";
import React from 'react';
import { pureRender,  debounce } from '../utils';
import { lookupCompany, lookupOwnCompany } from '../actions';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { push } from 'react-router-redux'
import { showTransactionView } from '../actions';
import { RecentActivityWidget } from './recentActivity';
import { AlertsWidget } from './alerts';
import { FavouritesWidget } from './favourites';
import { CompaniesWidget } from './companies';
import { TemplateWidget } from './templates';
import { CalendarWidget } from './calendar';
import { AsyncHOCFactory, EVENTS, RECENT_ACTIVITY, COMPANIES, ALERTS, FAVOURITES } from '../hoc/resources';

export class LandingPageView extends React.Component {
    render() {
        return  <div>
            <div className="container-fluid page-top">
                <div className="container">

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
                        <AlertsWidget />
                        <FavouritesWidget />
                        <RecentActivityWidget />
                    </div>
                </div>
            </div>
    }
}

