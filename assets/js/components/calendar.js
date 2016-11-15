"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux'
import { asyncConnect } from 'redux-connect';
import { requestResource, resetModals } from '../actions';
import { stringToDateTime } from '../utils';
import { Link } from 'react-router';
import { AlertWarnings } from './companyAlerts';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Button from 'react-bootstrap/lib/Button';
import moment from 'moment';
import Calendar from 'react-widgets/lib/Calendar';
import LawContainer from './lawBrowserContainer';

export default class CalendarFull extends React.Component {
    render() {
        const activities = this.props.data || [];

        return <LawContainer>
            <div className="widget">
                <div className="widget-header">
                    <div className="widget-title">
                    <span className="fa fa-calendar"/> Calendar
                   <div className="widget-control">
                    </div>

                    </div>
                </div>

                <div className="widget-body">
                    <Calendar  />
                    <div className="button-row">
                        <Button bsStyle="info">Create Event</Button>
                    </div>
                </div>
            </div>
        </LawContainer>
    }
}


export class CalendarWidget extends React.Component {

    render() {
        const activities = this.props.data || [];
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                <span className="fa fa-calendar"/> Calendar

                </div>
                 <div className="widget-control">
                 <Link to={`/calendar`} >View All</Link>
                </div>
            </div>

            <div className="widget-body">
                <Calendar  />
                <div className="button-row">
                    <Button bsStyle="info">Create Event</Button>
                </div>
            </div>
        </div>
    }
}