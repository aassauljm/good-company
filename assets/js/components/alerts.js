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

export function sortAlerts(response) {
    const data = (response || [])
    data.sort((a, b) => {
        return ((a.deadlines || {}).overdue ? 1 : -1) - ((b.deadlines || {}).overdue ? 1 : -1)
    });
    return data;
}

@connect((state, ownProps) => {
    return {alerts: state.resources['/alerts'] || {}, pendingJobs:  state.resources['/pending_jobs'] || {}};
}, {
    requestData: (key) => requestResource('/alerts', {postProcess: sortAlerts}),
    requestJobs: (refresh) => requestResource('/pending_jobs', {refresh: refresh}),
    refreshCompanies: () => requestResource('/company', {refresh: true}),
    refreshRecentActivity: () => requestResource('/recent_activity', {refresh: true}),
    refreshAlerts: () => requestResource('/alerts', {refresh: true, postProcess: sortAlerts}),
    navigate: (url) => push(url),
    resetModals: () => resetModals()
})
export class AlertsWidget extends React.Component {
    static POLL_INTERVAL = 10000;

     constructor(props) {
        super(props);
        this.state = {pendingJobs: (props.pendingJobs.data && props.pendingJobs.data.pending) || []};
    }

    fetch(refresh) {
        this.props.requestData()
        this.props.requestJobs(refresh)
            .then((r) => {
                if(!this._unmounted && r.response){
                    if(this.state.pendingJobs.length && this.state.pendingJobs.length !== r.response.pending.length){
                        this.refreshAll();
                    }
                    this.setState({pendingJobs: r.response.pending})
                    if(r.response.pending.length){
                        this._setTimeout = setTimeout(() => this.fetch(true), AlertsWidget.POLL_INTERVAL)
                    }
                }
            })
    };

    refreshAll() {
        this.props.refreshCompanies();
        this.props.refreshRecentActivity();
        this.props.refreshAlerts();
    }

    componentDidMount() {
        this.fetch(true);
    }

    componentWillUnmount() {
        clearTimeout(this._interval);
        this._unmounted = true;
    }

    handleClick(activity) {
        if(activity.data.companyId){

        }
    }

    renderAlerts() {
        if(this.props.alerts._status === 'complete'){
            const thisMonth = moment().format('MMMM');
            let warnings = [], danger = [], safe = [], firstCompanyId;

            const shareClassWarningCount = this.props.alerts.data.reduce((acc, a) => {
                return acc + (a.warnings.shareClassWarning ? 1 : 0);
            }, 0);

            this.props.alerts.data.map(a => {
                if(Object.keys(a.warnings).some(k => a.warnings[k]) && !firstCompanyId){
                    firstCompanyId = a.id;
                }
            }, 0);

            if(shareClassWarningCount > 1){
                danger.push(<li key='bulk'><div><Link to={`/mass_setup`} className={'text-success alert-entry'} onClick={this.props.resetModals} ><Glyphicon glyph="cog" className="big-icon"/>Click here to bulk setup your companies.</Link></div></li>);
            }

            if(firstCompanyId){
                danger.push(<li key='guidedsetup'><div><Link to={`/company/view/${firstCompanyId}/guided_setup`} onClick={this.props.resetModals} className={'text-success alert-entry'}><Glyphicon glyph="repeat" className="big-icon"/>Click here to step through company alerts.</Link></div></li>);
            }



            this.props.alerts.data.map((a, i) => {
                if(Object.keys(a.warnings).some(warning => a.warnings[warning])){
                    warnings.push(<li key={i+'.0'}><AlertWarnings.ResolveAllWarnings companyId={a.id} resetModals={this.props.resetModals} companyName={a.companyName}/></li>)
                }
                if(a.deadlines.annualReturn){
                    if(a.deadlines.annualReturn.overdue){
                        const dueDiff = moment(a.deadlines.annualReturn.dueDate).from(moment());
                        danger.push(<li key={i+'.1'}><div><Link to={`/company/view/${a.id}`} className={'text-danger alert-entry'}><Glyphicon glyph="warning-sign" className="big-icon"/>Annual Return for { a.companyName } is overdue ({dueDiff}).</Link></div></li>);
                    }
                    if(!a.deadlines.annualReturn.filedThisYear && thisMonth === a.deadlines.annualReturn.arFilingMonth){
                        warnings.push(<li key={i+'.2'}><div><Link to={`/company/view/${a.id}`} className={'text-warning alert-entry'}><Glyphicon glyph="warning-sign" className="big-icon"/>Annual Return for { a.companyName } is due this month.</Link></div></li>);
                    }
                    if(a.deadlines.annualReturn.filedThisYear){
                        safe.push(<li key={i+'.3'}><div><Link to={`/company/view/${a.id}`} className={'text-success alert-entry'}><Glyphicon glyph="ok-sign" className="big-icon"/>Annual Return for { a.companyName } already filed this year.</Link></div></li>);
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

    renderPendingJobs(){
        if(!this.state.pendingJobs.length){
            return false;
        }
        const importCount = this.state.pendingJobs.filter(p => p.type === 'import').length;
        const transactionCount = this.state.pendingJobs.filter(p => p.type === 'transactions').length;
        const imports = `${ importCount } company ${ importCount > 1 ? 'imports' : 'import'}`;
        const transaction = `${ transactionCount } ${ transactionCount > 1 ? 'transactions' : 'transaction'}`;
        return <li>
            <div className={'text-success alert-entry'}>
                <Glyphicon glyph="export" className="big-icon"/>
                { !!importCount && imports }
                { !!importCount && !!transactionCount && ', '}
                { !!transactionCount && transaction } remaining
                </div>
            </li>
    }

    renderBody() {
        return <ul>
        { this.renderPendingJobs() }
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