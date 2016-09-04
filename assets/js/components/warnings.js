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


const DEFAULT_OBJ = {};

export function getWarnings(companyState) {
    const shareClassWarning = (!companyState.shareClasses || !companyState.shareClasses.shareClasses) ;
    const historyWarning = !!(companyState.warnings.pendingHistory);
    const votingShareholderWarning = !!(companyState.warnings.missingVotingShareholders);
    const applyShareClassWarning = !shareClassWarning && !!companyState.shareCountByClass['null'];
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
        Click here to setup your share register.</Link>
        </div>
    }
}

const AlertWarnings = {
    ApplyShareClasses: ApplyShareClasses,
    PopulateHistory: PopulateHistory,
    SpecifyShareClasses: SpecifyShareClasses,
    SpecifyVotingHolders: SpecifyVotingHolders,
    ResolveAllWarnings: ResolveAllWarnings
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

    renderDeadlines(deadlines, showTypes) {
        return ['annualReturn'].filter((key, i) => statusIs(deadlines.annualReturn, showTypes))
                                .map((key, i) => <li key={i}>
                <div><a href="#" className={deadlineToClassName(deadlines[key])}>{deadlineToGlyph(deadlines[key])} { deadlines[key].message}</a></div>
            </li>
        );

    }

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
        const deadlines = this.renderDeadlines(this.props.companyState.deadlines, this.props.showTypes)

        return <ul>
                { guide && <li><AlertWarnings.ResolveAllWarnings companyId={this.props.companyId} resetModals={this.props.resetModals}/></li>}
                { deadlines }
                { this.props.showAllWarnings && this.renderImportWarnings(warn) }
                { !guide && !dealines.length && !this.props.showAllWarnings && <li>No current Notifications</li>}
                </ul>
    }
}


export class CompanyAlertsWidget extends React.Component {
    static propTypes = {
        companyState: PropTypes.object.isRequired,
        companyId: PropTypes.string.isRequired,
    };
    render() {
        const warn = getWarnings(this.props.companyState);
        if(!warn.shareClassWarning && !warn.historyWarning && !warn.applyShareClassWarning && !warn.votingShareholderWarning){
            return false;
        }
        const showAllWarnings = false;
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
