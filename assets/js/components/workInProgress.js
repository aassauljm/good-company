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
import moment from 'moment';


export class WorkInProgressWidget extends React.Component {
    handleClick() {

    }

    render() {
        const activities = this.props.data || [];
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                <span className="fa fa-tasks"/> Work In Progress
                </div>
            </div>

            <div className="widget-body">
                TO DO
            </div>
        </div>
    }
}