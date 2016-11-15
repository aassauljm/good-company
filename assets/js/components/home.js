"use strict";
import React from 'react';
import { pureRender,  debounce } from '../utils';
import { lookupCompany, lookupOwnCompany } from '../actions';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { push } from 'react-router-redux'
import { showModal } from '../actions';
import { RecentActivityWidget } from './recentActivity';
import { AlertsWidget } from './alerts';
import { FavouritesWidget } from './favourites';
import { CompaniesWidget } from './companies';
import { TemplateWidget } from './templates';
import { CalendarWidget } from './calendar';
import { WorkInProgressWidget } from './workInProgress';



export default class Home extends React.Component {

    render() {
        return <div className="container">
                <div className="row">
                    <div className="col-md-6">
                        <CalendarWidget />
                        <CompaniesWidget />
                        <TemplateWidget />
                        <WorkInProgressWidget />

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

