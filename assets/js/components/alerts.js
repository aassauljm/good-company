"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux'
import { asyncConnect } from 'redux-connect';
import { requestResource, resetModals } from '../actions';
import { stringToDateTime } from '../utils';
import { Link } from 'react-router';
import { AlertWarnings } from './warnings';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import moment from 'moment';

function sortAlerts(response) {
    response.sort((a, b) => {
        return ((a.deadlines || {}).overdue ? 1 : -1) - ((b.deadlines || {}).overdue ? 1 : -1)
    })
    return response;
}

@connect((state, ownProps) => {
    return {alerts: state.resources['/alerts'] || {}, pendingJobs:  state.resources['/pending_jobs'] || {}};
}, {
    requestData: (key) => requestResource('/alerts', {postProcess: sortAlerts}),
    requestJobs: (refresh) => requestResource('/pending_jobs', {refresh: refresh}),
    refreshCompanies: () => requestResource('/company', {refresh: true}),
    refreshRecentActivity: () => requestResource('/recent_activity', {refresh: true}),
    navigate: (url) => push(url),
    resetModals: () => resetModals()
})
export class AlertsWidget extends React.Component {
    static POLL_INTERVAL = 10000;

     constructor(props) {
        super(props);
        this.state = {pendingJobs: (props.pendingJobs.data && props.pendingJobs.data.pending.length) || 0};
    }

    fetch(refresh) {
        this.props.requestData()
        this.props.requestJobs(refresh)
            .then((r) => {
                if(r.response){
                    if(this.state.pendingJobs && this.state.pendingJobs !== r.response.pending.length){
                        this.refreshAll();
                    }
                    this.setState({pendingJobs: r.response.pending.length || 0})
                    if(r.response.pending.length){
                        this._setTimeout = setTimeout(() => this.fetch(true), AlertsWidget.POLL_INTERVAL)
                    }
                }
            })
    };

    refreshAll() {
        this.props.refreshCompanies();
        this.props.refreshRecentActivity();
    }

    componentDidMount() {
        this.fetch(true);
    }

    componentWillUnmount() {
        clearTimeout(this._interval);
    }

    handleClick(activity) {
        if(activity.data.companyId){

        }
    }

    renderAlerts() {
        if(this.props.alerts._status === 'complete'){
            const thisMonth = moment().format('MMMM')
            const warnings = [], danger = [];
            this.props.alerts.data.map((a, i) => {
                if(a.warnings.pendingHistory || a.warnings.missingVotingShareholder){
                    warnings.push(<li key={i}><AlertWarnings.ResolveAllWarnings companyId={a.id} resetModals={this.props.resetModals} companyName={a.companyName}/></li>)
                }
                if(a.deadlines.annualReturn){
                    if(a.deadlines.annualReturn.overdue){
                        danger.push(<li key={i}><div><Link to={`/company/view/${a.id}`} className={'text-danger alert-entry'}><Glyphicon glyph="warning-sign" className="big-icon"/>Annual Return for { a.companyName } is overdue.</Link></div></li>);
                    }
                    if(!a.deadlines.annualReturn.filedThisYear && thisMonth === a.deadlines.annualReturn.arFilingMonth){
                        warnings.push(<li key={i}><div><Link to={`/company/view/${a.id}`} className={'text-warning alert-entry'}><Glyphicon glyph="warning-sign" className="big-icon"/>Annual Return for { a.companyName } is due this month.</Link></div></li>);
                    }
                }

            });
            const results = [...danger, ...warnings]
            if(!this.props.full){
                return results.slice(0, 10);
            }
            return results;
        }
    }

    renderBody() {
        return <ul>
        {!!this.state.pendingJobs && <li>{ this.state.pendingJobs } Company { this.state.pendingJobs > 1 ? 'imports' : 'import'} remaining</li> }
        { this.renderAlerts() }
        </ul>
    }

    render() {
        const activities = this.props.data || [];
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    Notifications
                </div>
                { !this.props.full && <div className="widget-control">
                    <Link to="/alerts" >View All</Link>
                </div> }
            </div>

            <div className="widget-body">
                { this.renderBody() }
            </div>
        </div>
    }
}

const Alerts = (props) => {
    return <div className="container">
            <div className="row">
                    <AlertsWidget full={true}/>
            </div>
        </div>
};
export default Alerts;