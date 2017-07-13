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
                        danger.push(<li key={i+'.1'}><div><Link to={url} className={'text-danger alert-entry'}><Glyphicon glyph="warning-sign" className="big-icon"/>Annual return for { a.companyName } is overdue ({dueDiff}).</Link></div></li>);
                    }
                    if(!a.deadlines.annualReturn.filedThisYear && thisMonth === a.deadlines.annualReturn.arFilingMonth){
                        warnings.push(<li key={i+'.2'}><div><Link to={url} className={'text-warning alert-entry'}><Glyphicon glyph="warning-sign" className="big-icon"/>Annual return for { a.companyName } is due this month.</Link></div></li>);
                    }
                    if(a.deadlines.annualReturn.filedThisYear){
                        safe.push(<li key={i+'.3'}><div><Link to={url} className={'text-success alert-entry'}><Glyphicon glyph="ok-sign" className="big-icon"/>Annual return for { a.companyName } already filed this year.</Link></div></li>);
                    }
                }

            });
            return {warnings, danger, safe};
        }
}


export function alertListSummaries(props){
    const full = props.full;
    if(props.alerts.data){
        const orderedResults = [];
        const { firstWarningCompanyId, firstDeadlineCompanyId, requiresSetup, counts } = props.alerts.data.groupedAlerts;

        [{key: 'feedback', title: 'have feedback to review', string: (seconds) => 'has feedback to review', style: 'info', glyph: <Glyphicon glyph="comment" className="big-icon"/>},
            {key: 'overdue', title: 'are overdue', string: (seconds) => `is overdue (${moment.duration(-seconds, 'seconds').humanize(true)})`, style: 'danger', glyph: <Glyphicon glyph="warning-sign" className="big-icon"/>},
            {key: 'dueThisMonth', title: 'are due this month', string: () => 'is due this month', style: 'warning', glyph : <Glyphicon glyph="warning-sign" className="big-icon"/>},
            {key: 'dueNextMonth', title: 'are due next month', string: () => 'is due next month', style: 'success', glyph: <Glyphicon glyph="time" className="big-icon"/>},
        ].map(type => {
            const fullKey = `annualReturn-${type.key}`;
            if(counts[fullKey] && props.include.annualReturns && props.include.annualReturns[type.key]){
                if(counts[fullKey].length > 1){
                    const url = full ? `/company/view/${firstDeadlineCompanyId}/annual_returns?show_next=true` :  `/annual_returns`;
                    orderedResults.push(<li key={`${fullKey}-bulk`}>
                                        <Link to={url} className={`text-${type.style} alert-entry`}>
                                        { type.glyph }
                                         { counts[fullKey].length } annual returns {type.title}. { full ? 'Click here to step through.' : 'Click here to view.'}</Link>
                                        </li>);
                }
                if(counts[fullKey].length && (props.full || counts[fullKey].length === 1)) {
                    const alert = counts[fullKey].map(alert => {
                        const url = `/company/view/${alert.id}/annual_returns`;
                        orderedResults.push(<li  className={counts[fullKey].length > 1 ? "singular" : ''} key={orderedResults.length}>
                                            <div>
                                            <Link to={url} className={`text-${type.style} alert-entry`}>
                                            { type.glyph }
                                            Annual return for { alert.companyName } {type.string(alert.deadlines.annualReturn.seconds)}.</Link>
                                            </div></li>);
                    });
                }
            }
        });

        if(counts['shareClassWarning'] && counts['shareClassWarning'].length > 1  && props.include.bulkSetup){
            orderedResults.push(<li key='bulk'>
                                <div>
                                <Link to={`/mass_setup`} className={'text-success alert-entry'} onClick={props.resetTransactionViews} >
                                <Glyphicon glyph="cog" className="big-icon"/>{ counts['shareClassWarning'].length } companies require share classes.  Click here for bulk setup.</Link>
                                </div></li>);
        }

        if(firstWarningCompanyId && requiresSetup > 1 && props.include.guidedSetup){
            const url = full ? `/company/view/${firstWarningCompanyId}/guided_setup?show_next=true` : `/share_register_alerts`;
            orderedResults.push(<li key='guidedsetup'>
                        <div>
                        <Link to={url} onClick={props.resetTransactionViews} className={'text-success alert-entry'}>
                        <Glyphicon glyph="repeat" className="big-icon"/>{ requiresSetup } companies require share registers. { full ? 'Click here to step through.' : 'Click here to view.'}</Link>
                        </div></li>);
        }

        if((props.full || requiresSetup === 1) && props.include.guidedSetup){
            props.alerts.data.alertList.map(alert => {
                if(Object.keys(alert.warnings).some(warning => alert.warnings[warning])){
                    orderedResults.push(<li  className={requiresSetup > 1 ? "singular" : ''} key={orderedResults.length}><AlertWarnings.ResolveAllWarnings companyId={alert.id} resetTransactionViews={props.resetTransactionViews} companyName={alert.companyName}/></li>)
                }
            })
        }

        return orderedResults;
    }
}

const COLLAPSE_LENGTH = 10;
export class CollapsableAlertSegment extends React.PureComponent {
    constructor(props){
        super(props);
        this.hideAll = ::this.hideAll;
        this.showAll = ::this.showAll;
        this.state = {long: props.list.length > COLLAPSE_LENGTH, hidden: props.list.length > COLLAPSE_LENGTH};
    }


    hideAll() {
        this.setState({hidden: true})
    }

    showAll() {
        this.setState({hidden: false})
    }

    render() {
        return <ul>
            { this.state.hidden ? this.props.list[0] : this.props.list }
            { this.state.hidden && this.state.long && <li className="alert-toggle singular" ><a href="#" className="alert-control" onClick={this.showAll}><i className="fa fa-chevron-down"/>Show All</a></li> }
            { !this.state.hidden && this.state.long && <li className="alert-toggle singular" ><a href="#" className="alert-control " onClick={this.hideAll}><i className="fa fa-chevron-up"/>Hide All</a></li> }
        </ul>
    }
}

export class CollapsableAlertSegments extends React.PureComponent {
    render() {
        const possibleIncludes = {
            annualReturns: {'feedback': true, 'overdue': true, 'dueThisMonth': true, 'dueNextMonth': true},
            bulkSetup: true,
            guidedSetup: true
        }
        return <li>
            { Object.keys(possibleIncludes).map((key) => {
                if(this.props.include[key]){
                    if(this.props.include[key] === true){
                        return  <CollapsableAlertSegment key={key} list={ this.props.listCreator({...this.props, include: {[key]: true}}) } />
                    }
                    else{
                        return Object.keys(possibleIncludes[key]).map(subKey => {
                            if(this.props.include[key][subKey]){
                                  return  <CollapsableAlertSegment key={`${key}-${subKey}`} list={ this.props.listCreator({...this.props, include: {[key]: {[subKey]: true}}}) } />
                            }
                        }).filter(f => f)
                    }
                }
            }).filter(f => f) }
        </li>
    }
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

    renderCollapsableParts() {
        return <CollapsableAlertSegments alerts={this.props.alerts} include={this.props.include} listCreator={this.props.listCreator} full={true}/>
    }

    renderAlerts() {
        if(this.props.alerts.data){
            if(this.props.listCreator && this.props.full){
                return this.renderCollapsableParts();
            }
            if(this.props.listCreator){
                return this.props.listCreator(this.props);
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
        return <ul className="alert-list">
        { this.renderPendingJobs() }
        { this.renderAlerts() }
        </ul>
    }

    render() {
        const activities = this.props.data || [];
        return <Widget className={"alerts-widget " + (this.props.className || '')}  iconClass="fa fa-exclamation-circle" title={ this.props.title || "Notifications"} link={this.props.link !== false && "/alerts"}>
                { this.renderBody() }
                </Widget>
    }
}

export const AlertsSummaryWidget = (props) => {
    return <AlertsWidget {...props} listCreator={alertListSummaries} include={{
        annualReturns: {'feedback': true, 'overdue': true, 'dueThisMonth': true},
        bulkSetup: true,
        guidedSetup: true
    }}/>
}


export const AnnualReturnAlerts = (props) => {
    return <LawBrowserContainer>
                <AlertsWidget className="alerts-full" title="Annual Return Notifications"  include={{
        annualReturns: {'feedback': true, 'overdue': true, 'dueThisMonth': true, 'dueNextMonth': true}
    }} full={true} link={false} listCreator={alertListSummaries} />
        </LawBrowserContainer>
};

export const ShareRegisterAlerts = (props) => {
    return <LawBrowserContainer>
                <AlertsWidget className="alerts-full" title="Share Register Notifications"  include={{
       guidedSetup: true
    }} full={true} link={false} listCreator={alertListSummaries} />
        </LawBrowserContainer>
};

const Alerts = (props) => {
    return <LawBrowserContainer>
                <AlertsWidget className="alerts-full" full={true} link={false} listCreator={alertListSummaries} include={{
        annualReturns: {'feedback': true, 'overdue': true, 'dueThisMonth': true, 'dueNextMonth': true},
        bulkSetup: true,
        guidedSetup: true
    }}/>
        </LawBrowserContainer>
};

export default Alerts;