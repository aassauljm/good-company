"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux'
import { requestResource, resetTransactionViews } from '../actions';
import { stringDateToFormattedStringTime } from '../utils';
import { Link } from 'react-router';
import { AlertWarnings } from './companyAlerts';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import moment from 'moment';
import { sortAlerts } from '../utils';
import { AlertsHOC } from '../hoc/resources'
import Widget from './widget';
import LawBrowserContainer from './lawBrowserContainer';


export const requestAlerts = () => requestResource('/alerts', {postProcess: sortAlerts})


export function alertList(props){
     if(props.alerts.data){
            const thisMonth = moment().format('MMMM');
            let warnings = [], danger = [], safe = [], firstCompanyId;

            const shareClassWarningCount = props.alerts.data.alertList.reduce((acc, a) => {
                return acc + (a.warnings.shareClassWarning ? 1 : 0);
            }, 0);

            props.alerts.data.alertList.map(a => {
                if(Object.keys(a.warnings).some(k => a.warnings[k]) && !firstCompanyId){
                    firstCompanyId = a.id;
                }
            }, 0);

            if(shareClassWarningCount > 1){
                danger.push(<li key='bulk'><div><Link to={`/mass_setup`} className={'text-success alert-entry'} onClick={props.resetTransactionViews} ><Glyphicon glyph="cog" className="big-icon"/>Click here to set up multiple companies at the same time.</Link></div></li>);
            }

            if(firstCompanyId && props.alerts.data.alertList.length > 1){
                danger.push(<li key='guidedsetup'><div><Link to={`/company/view/${firstCompanyId}/guided_setup?show_next=true`} onClick={props.resetTransactionViews} className={'text-success alert-entry'}><Glyphicon glyph="repeat" className="big-icon"/>Click here to step through company alerts.</Link></div></li>);
            }

            props.alerts.data.alertList.map((a, i) => {
                if(Object.keys(a.warnings).some(warning => a.warnings[warning])){
                    warnings.push(<li key={i+'.0'}><AlertWarnings.ResolveAllWarnings companyId={a.id} resetTransactionViews={props.resetTransactionViews} companyName={a.companyName}/></li>)
                }
                if(a.deadlines.annualReturn){
                    const url = `/company/view/${a.id}/annual_returns`;
                    if(a.deadlines.annualReturn.overdue){
                        const dueDiff = moment(a.deadlines.annualReturn.dueDate).from(moment());
                        danger.push(<li key={i+'.1'}><div><Link to={url} className={'text-danger alert-entry'}><Glyphicon glyph="warning-sign" className="big-icon"/>Annual Return for { a.companyName } is overdue ({dueDiff}).</Link></div></li>);
                    }
                    if(!a.deadlines.annualReturn.filedThisYear && thisMonth === a.deadlines.annualReturn.arFilingMonth){
                        warnings.push(<li key={i+'.2'}><div><Link to={url} className={'text-warning alert-entry'}><Glyphicon glyph="warning-sign" className="big-icon"/>Annual Return for { a.companyName } is due this month.</Link></div></li>);
                    }
                    if(a.deadlines.annualReturn.filedThisYear){
                        safe.push(<li key={i+'.3'}><div><Link to={url} className={'text-success alert-entry'}><Glyphicon glyph="ok-sign" className="big-icon"/>Annual Return for { a.companyName } already filed this year.</Link></div></li>);
                    }
                }

            });
            return {warnings, danger, safe};
        }
}


export function alertListSummaries(props){
    return false;
}

@AlertsHOC(true)
@connect((state, ownProps) => {
    return {pendingJobs:  state.resources['/pending_jobs'] || {}};
}, {
    requestJobs: (refresh) => requestResource('/pending_jobs', {refresh: refresh}),
    refreshCompanies: () => requestResource('companies', {refresh: true}),
    refreshRecentActivity: () => requestResource('/recent_activity', {refresh: true}),
    refreshAlerts: () => requestResource('/alerts', {postProcess: sortAlerts, refresh: true}),
    navigate: (url) => push(url),
    resetTransactionViews: () => resetTransactionViews()
})
export class AlertsWidget extends React.PureComponent {
    static POLL_INTERVAL = 10000;

     constructor(props) {
        super(props);
        this.state = {pendingJobs: (props.pendingJobs.data && props.pendingJobs.data.pending) || []};
    }

    fetch(refresh) {
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
        if(this.props.alerts.data){
            if(this.props.listCreator){
                return this.props.listCreator(this.props)
            }
            const {danger, warnings} = alertList(this.props);
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
        const transaction = `${ transactionCount } ${ transactionCount > 1 ? 'history imports' : 'history import'}`;
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
        return <Widget className="alerts-widget" iconClass="fa fa-exclamation-circle" title="Notifications" link={this.props.link !== false && "/alerts"}>
                { this.renderBody() }
                </Widget>
    }
}

export const AlertsSummaryWidget = (props) => {
    return <AlertsWidget {...props} listCreator={alertListSummaries} />
}

const Alerts = (props) => {
    return <LawBrowserContainer>
                <AlertsWidget full={true} link={false}/>
        </LawBrowserContainer>
};

export default Alerts;