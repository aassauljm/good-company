"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux'
import { asyncConnect } from 'redux-connect';
import { requestResource } from '../actions';
import { stringToDateTime } from '../utils';
import { Link } from 'react-router';


@connect((state, ownProps) => {
    return {alerts: state.resources['/alerts'] || {}, pendingJobs:  state.resources['/pending_jobs'] || {}};
}, {
    requestData: (key) => requestResource('/alerts'),
    requestJobs: (refresh) => requestResource('/pending_jobs', {refresh: refresh}),
    refreshCompanies: () => requestResource('/company', {refresh: true}),
    refreshRecentActivity: () => requestResource('/recent_activity', {refresh: true}),
    navigate: (url) => push(url)
})
export class AlertsWidget extends React.Component {
    static POLL_INTERVAL = 5000;

     constructor(props) {
        super(props);
        this.state = {pendingJobs: (props.pendingJobs.data && props.pendingJobs.data.pending.length) || 0};
    }

    fetch(refresh) {
        return this.props.requestJobs(refresh)
            .then((r) => {
                if(r.response){
                    if(this.state.pendingJobs && this.state.pendingJobs !== r.response.pending.length){
                        this.refreshAll();
                    }
                    this.setState({pendingJobs: r.response.pending.length || 0})
                }
            })
    };

    poll() {
        clearInterval(this._interval);
        this._interval = setInterval(() => this.fetch(true), AlertsWidget.POLL_INTERVAL)
    }

    refreshAll() {
        this.props.refreshCompanies();
        this.props.refreshRecentActivity();
    }

    componentDidMount() {
        this.fetch(true);
        this.poll();
    }

    componentWillUnmount() {
        clearInterval(this._interval);
    }

    handleClick(activity) {
        if(activity.data.companyId){

        }
    }

    renderBody() {
        return <ul>
        {!!this.state.pendingJobs && <li>{ this.state.pendingJobs } Company { this.state.pendingJobs > 1 ? 'imports' : 'import'} remaining</li> }
        <li>No current Notifications</li>
        </ul>
    }

    render() {
        const activities = this.props.data || [];
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    Notifications
                </div>
                <div className="widget-control">
                <Link to="/alerts" >View All</Link>
                </div>
            </div>

            <div className="widget-body">
                { this.renderBody() }
            </div>
        </div>
    }
}