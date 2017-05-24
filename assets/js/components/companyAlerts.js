"use strict";
import React, {PropTypes} from 'react';
import {  showTransactionView, resetTransactionViews } from '../actions';
import { pureRender, numberWithCommas, stringDateToFormattedString } from '../utils';
import { connect } from 'react-redux';
import ButtonInput from './forms/buttonInput';
import { Link } from 'react-router';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import STRINGS from '../strings';
import { push } from 'react-router-redux'
import moment from 'moment';
import Widget from './widget';
import LawBrowserContainer from './lawBrowserContainer';


const DEFAULT_OBJ = {};

export function getWarnings(companyState) {
    const shareClassWarning = !!companyState.warnings.shareClassWarning;
    const historyWarning = !!companyState.warnings.pendingHistory;
    const votingShareholderWarning = !!companyState.warnings.missingVotingShareholders;
    const applyShareClassWarning = !shareClassWarning && !!companyState.warnings.applyShareClassWarning
    const pendingFuture = companyState.warnings.pendingFuture;
    return {
        shareClassWarning,
        historyWarning,
        votingShareholderWarning,
        applyShareClassWarning,
        pendingFuture
    }
}


@pureRender
class SpecifyShareClasses extends React.Component {
    render(){
        return  <div><Link to={`/company/view/${this.props.companyId}/share_classes`} className="text-danger alert-entry"> <Glyphicon glyph="warning-sign" className="big-icon"/>
        You need to specify share classes.  Click here to start.</Link></div>
    }
}

@pureRender
class ApplyShareClasses extends React.Component {
    render(){
        return  <div><a href="#" onClick={this.props.startApplyShareClasses} className="text-danger alert-entry">
        <Glyphicon glyph="warning-sign" className="big-icon"/>
        You need to apply share classes to existing share allocations.  Click here to start.</a>
        </div>
    }
}

@pureRender
class PopulateHistory extends React.Component {
    render(){
        return  <div><a  href="#" onClick={this.props.startHistoryImport} className="text-danger alert-entry">
        <Glyphicon glyph="warning-sign" className="big-icon"/>
        Historic company activity needs to be imported.  Click here to start.</a>
        </div>
    }
}

@pureRender
class SpecifyVotingHolders extends React.Component {
    render(){
        return  <div><a  href="#" onClick={this.props.startVotingHolders} className="text-danger alert-entry">
        <Glyphicon glyph="warning-sign" className="big-icon"/>
        Voting shareholders for each joint allocation must be specified.  Click here to start.</a>
        </div>
    }
}

@pureRender
class ResolveAllWarnings extends React.Component {
    render(){
        return  <div>
        <Link to={`/company/view/${this.props.companyId}/guided_setup`} onClick={this.props.resetTransactionViews} className="text-success alert-entry guided-setup-link">
        <Glyphicon glyph="forward" className="big-icon"/>
        { this.props.companyName ? `Set up share register for ${this.props.companyName}.` : "Click here to set up the company's share register." } </Link>
        </div>
    }
}

@pureRender
class PendingFuture extends React.Component {
    render(){
        return  <div><a  href="#" onClick={this.props.startFutureImport } className="text-danger alert-entry">
        <Glyphicon glyph="transfer" className="big-icon"/>
         New Companies Register records found. Click here to start reconciliation.</a>
        </div>
    }
}


 export const AlertWarnings = {
    ApplyShareClasses: ApplyShareClasses,
    PopulateHistory: PopulateHistory,
    SpecifyShareClasses: SpecifyShareClasses,
    SpecifyVotingHolders: SpecifyVotingHolders,
    ResolveAllWarnings: ResolveAllWarnings,
    PendingFuture: PendingFuture
};


const statusIs = (type, list) =>{
    return list.indexOf(type.status) > -1;
}

const deadlineToClassName = (type) => {
    return {
        'danger': ' alert-entry text-danger',
        'warning': ' alert-entry text-warning',
        'safe': ' alert-entry text-success',
        'pending': ' alert-entry'
    }[type.status]
}

const deadlineToGlyph = (type) => {
    return {
        'danger': <Glyphicon glyph="warning-sign" className="big-icon"/>,
        'warning': <Glyphicon glyph="warning-sign" className="big-icon"/>,
        'safe': <Glyphicon glyph="ok" className="big-icon"/>,
        'pending': <Glyphicon glyph="refresh" className="big-icon"/>,
    }[type.status]
}

const Deadlines = (props) => {

}

export function arDue(deadlines){
    const thisMonth = moment().format('MMMM')
    if(!deadlines.annualReturn){
        return false;
    }
    if(deadlines.annualReturn.overdue || (!deadlines.annualReturn.filedThisYear && thisMonth === deadlines.annualReturn.arFilingMonth)){
        return true;
    }
}

export function renderDeadlines(deadlines, showTypes, companyId) {
    let i = 0;
    const results = [];
    if(!deadlines.annualReturn){
        return [];
    }
    const url = `/company/view/${companyId}/annual_returns`;
    if(showTypes.indexOf('danger') > -1 && deadlines.annualReturn.overdue){
        const dueDiff = moment.duration(-deadlines.annualReturn.seconds, 'seconds').humanize(true);
        results.push(<li key={i++}><div><Link to={url} className={'text-danger alert-entry'}><Glyphicon glyph="warning-sign" className="big-icon"/>Annual return is overdue ({dueDiff}).</Link></div></li>);
    }
    if(showTypes.indexOf('warning') > -1  && deadlines.annualReturn.dueThisMonth){
        results.push(<li key={i++}><div><Link to={url} className={'text-warning alert-entry'}><Glyphicon glyph="warning-sign" className="big-icon"/>Annual return is due this month.</Link></div></li>);
    }
    if(showTypes.indexOf('safe') > -1  && deadlines.annualReturn.filedThisYear){
        results.push(<li key={i++}><div><Link to={url} className={'text-success alert-entry'}><Glyphicon glyph="ok-sign" className="big-icon"/>Annual return already filed this year.</Link></div></li>);
    }
    return results;
}

export function hasDeadlines(deadlines, showTypes){
    const thisMonth = moment().format('MMMM')
    if(!deadlines.annualReturn){
        return false;
    }
    if(showTypes.indexOf('danger') > -1 && deadlines.annualReturn.overdue){
        return true;
    }
    if(showTypes.indexOf('warning') > -1  && !deadlines.annualReturn.filedThisYear && thisMonth === deadlines.annualReturn.arFilingMonth){
        return true;
    }
    if(showTypes.indexOf('safe') > -1  && deadlines.annualReturn.filedThisYear){
        return true;
    }
}

function hasAlerts(companyState, showTypes){
    const warn = getWarnings(companyState);
    const guide = warn.shareClassWarning || warn.historyWarning || warn.applyShareClassWarning || warn.votingShareholderWarning;
    const deadlines = hasDeadlines(companyState.deadlines, showTypes)
    const pendingFuture = warn.pendingFuture;
    return pendingFuture || guide || deadlines;
}

@connect(() => DEFAULT_OBJ, (dispatch, ownProps) => {
    return {
        startHistoryImport: () => {
            dispatch(push(`/company/view/${ownProps.companyId}/new_transaction`));
            dispatch(showTransactionView('importHistory', {companyState: ownProps.companyState, companyId: ownProps.companyId}));
        },
        startApplyShareClasses: () => {
            dispatch(push(`/company/view/${ownProps.companyId}/new_transaction`));
            dispatch(showTransactionView('applyShareClasses', {companyState: ownProps.companyState, companyId: ownProps.companyId}));
        },
        startVotingHolders: () => {
            dispatch(push(`/company/view/${ownProps.companyId}/new_transaction`));
            dispatch(showTransactionView('votingShareholders', {companyState: ownProps.companyState, companyId: ownProps.companyId}));
        },
        startFutureImport: () => {
            dispatch(push(`/company/view/${ownProps.companyId}/new_transaction`));
            dispatch(showTransactionView('importFuture', {companyState: ownProps.companyState, companyId: ownProps.companyId}));
        },

        resetTransactionViews: () => dispatch(resetTransactionViews())
    }
})
export class CompanyAlertsBase extends React.Component {
    static propTypes = {
        companyState: PropTypes.object.isRequired,
        companyId: PropTypes.string.isRequired,
        showTypes: PropTypes.array.isRequired
    };
    renderImportWarnings(warn) {
        return <div>
            { warn.shareClassWarning && <li><AlertWarnings.SpecifyShareClasses companyId={this.props.companyId}/></li>}
            { warn.applyShareClassWarning && <li><AlertWarnings.ApplyShareClasses companyId={this.props.companyId} startApplyShareClasses={this.props.startApplyShareClasses}/></li>}
            { warn.historyWarning && <li><AlertWarnings.PopulateHistory companyId={this.props.companyId} startHistoryImport={this.props.startHistoryImport}/></li>}
            { warn.votingShareholderWarning && <li><AlertWarnings.SpecifyVotingHolders companyId={this.props.companyId} startVotingHolders={this.props.startVotingHolders} /></li>}
        </div>
    }

    render() {
        const warn = getWarnings(this.props.companyState);
        const guide = warn.shareClassWarning || warn.historyWarning || warn.applyShareClassWarning || warn.votingShareholderWarning;
        const deadlines = renderDeadlines(this.props.companyState.deadlines, this.props.showTypes, this.props.companyId);
        const pendingFuture = warn.pendingFuture;

        return <ul className="company-alerts">
                { pendingFuture && <li><AlertWarnings.PendingFuture companyId={this.props.companyId} startFutureImport={this.props.startFutureImport}/></li> }
                { guide && <li><AlertWarnings.ResolveAllWarnings companyId={this.props.companyId} resetTransactionViews={this.props.resetTransactionViews}/></li>}
                { deadlines }
                { this.props.showAllWarnings && this.renderImportWarnings(warn) }
                { !guide && !deadlines.length && !this.props.showAllWarnings && <li>No current Notifications</li>}
                </ul>
    }
}


export class CompanyAlertsWidget extends React.Component {
    static propTypes = {
        companyState: PropTypes.object.isRequired,
        companyId: PropTypes.string.isRequired,
    };
    render() {
        if(!hasAlerts(this.props.companyState, ['danger', 'warning'])){
            return false;
        }
        return <Widget className=" company-alerts-widget" iconClass="fa fa-exclamation-circle" title="Notifications" link={`/company/view/${this.props.companyId}/notifications`}>
             <CompanyAlertsBase {...this.props} showTypes={['danger', 'warning']} />
        </Widget>
    }
}

export const CompanyAlerts = (props) => {
    return <LawBrowserContainer>
            <Widget iconClass="fa fa-exclamation-circle" title="All Notifications">
                <CompanyAlertsBase {...props} showTypes={['danger', 'warning', 'pending', 'safe']} showAllWarnings={true} />
            </Widget>
        </LawBrowserContainer>
}
