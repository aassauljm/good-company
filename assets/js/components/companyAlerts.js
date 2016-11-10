"use strict";
import React, {PropTypes} from 'react';
import {  showModal, resetModals } from '../actions';
import { pureRender, numberWithCommas, stringToDate } from '../utils';
import { connect } from 'react-redux';
import ButtonInput from './forms/buttonInput';
import { Link } from 'react-router';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import STRINGS from '../strings';
import { push } from 'react-router-redux'
import moment from 'moment';

const DEFAULT_OBJ = {};

export function getWarnings(companyState) {
    const shareClassWarning = !!companyState.warnings.shareClassWarning;
    const historyWarning = !!companyState.warnings.pendingHistory;
    const votingShareholderWarning = !!companyState.warnings.missingVotingShareholders;
    const applyShareClassWarning = !shareClassWarning && !!companyState.warnings.applyShareClassWarning
    return {
        shareClassWarning,
        historyWarning,
        votingShareholderWarning,
        applyShareClassWarning
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
        <Link to={`/company/view/${this.props.companyId}/guided_setup`} onClick={this.props.resetModals} className="text-success alert-entry">
        <Glyphicon glyph="forward" className="big-icon"/>
        Click here to setup your share register{this.props.companyName && ` for ${this.props.companyName}`}.</Link>
        </div>
    }
}

@pureRender
class PendingUpdate extends React.Component {
    render(){
        return  <div><a  href="#" className="text-danger alert-entry">
        <Glyphicon glyph="refresh" className="big-icon"/>
        This company has pending updates queued.  You be unable to make changes until they are finished.</a>
        </div>
    }
}

export const AlertWarnings = {
    ApplyShareClasses: ApplyShareClasses,
    PopulateHistory: PopulateHistory,
    SpecifyShareClasses: SpecifyShareClasses,
    SpecifyVotingHolders: SpecifyVotingHolders,
    ResolveAllWarnings: ResolveAllWarnings,
    PendingUpdate: PendingUpdate
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

function renderDeadlines(deadlines, showTypes, companyId) {
    let i = 0;
    const results = [];
    const thisMonth = moment().format('MMMM')
    if(!deadlines.annualReturn){
        return [];
    }
    if(showTypes.indexOf('danger') > -1 && deadlines.annualReturn.overdue){
        const dueDiff = moment(deadlines.annualReturn.dueDate).from(moment());
        results.push(<li key={i++}><div><Link to={`/company/view/${companyId}`} className={'text-danger alert-entry'}><Glyphicon glyph="warning-sign" className="big-icon"/>Annual Return is overdue ({dueDiff}).</Link></div></li>);
    }
    if(showTypes.indexOf('warning') > -1  && !deadlines.annualReturn.filedThisYear && thisMonth === deadlines.annualReturn.arFilingMonth){
        results.push(<li key={i++}><div><Link to={`/company/view/${companyId}`} className={'text-warning alert-entry'}><Glyphicon glyph="warning-sign" className="big-icon"/>Annual Return is due this month.</Link></div></li>);
    }
    if(showTypes.indexOf('safe') > -1  && deadlines.annualReturn.filedThisYear){
        results.push(<li key={i++}><div><Link to={`/company/view/${companyId}`} className={'text-success alert-entry'}><Glyphicon glyph="ok-sign" className="big-icon"/>Annual Return already filed this year.</Link></div></li>);
    }
    return results;
}

function hasDeadlines(deadlines, showTypes){
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
    const pendingUpdates = companyState.hasPendingUpdates;
    return pendingUpdates || guide || deadlines;
}

@connect(() => DEFAULT_OBJ, (dispatch, ownProps) => {
    return {
        startHistoryImport: () => {
            dispatch(push(`/company/view/${ownProps.companyId}/new_transaction`));
            dispatch(showModal('importHistory', {companyState: ownProps.companyState, companyId: ownProps.companyId}));
        },
        startApplyShareClasses: () => {
            dispatch(push(`/company/view/${ownProps.companyId}/new_transaction`));
            dispatch(showModal('applyShareClasses', {companyState: ownProps.companyState, companyId: ownProps.companyId}));
        },
        startVotingHolders: () => {
            dispatch(push(`/company/view/${ownProps.companyId}/new_transaction`));
            dispatch(showModal('votingShareholders', {companyState: ownProps.companyState, companyId: ownProps.companyId}));
        },
        resetModals: () => dispatch(resetModals())
    }
})
export class CompanyAlertsBase extends React.Component {
    static propTypes = {
        companyState: PropTypes.object.isRequired,
        companyId: PropTypes.string.isRequired,
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
        const deadlines = renderDeadlines(this.props.companyState.deadlines, this.props.showTypes, this.props.companyId)
        const pendingUpdates = this.props.companyState.hasPendingUpdates;
        return <ul>
                { pendingUpdates && <li><AlertWarnings.PendingUpdate companyId={this.props.companyId} /></li> }
                { guide && <li><AlertWarnings.ResolveAllWarnings companyId={this.props.companyId} resetModals={this.props.resetModals}/></li>}
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
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    Notifications
                </div>
                <div className="widget-control">
                    <Link to={`/company/view/${this.props.companyId}/notifications`} >View All</Link>
                </div>
            </div>

            <div className="widget-body">
                <CompanyAlertsBase {...this.props} showTypes={['danger', 'warning']} />
            </div>
        </div>
    }
}

export const CompanyAlerts = (props) => {
    return <div className="container">
            <div className="row">
            <div className="widget">
                <div className="widget-header">
                    <div className="widget-title">
                        All Notifications
                    </div>
                </div>
                <div className="widget-body">
                    <CompanyAlertsBase {...props} showTypes={['danger', 'warning', 'pending', 'safe']} showAllWarnings={true} />
                </div>
            </div>
            </div>
        </div>
}
