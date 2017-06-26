"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux'
import { asyncConnect } from 'redux-connect';
import { requestResource } from '../actions';
import { stringDateToFormattedStringTime } from '../utils'
import { Link } from 'react-router'
import Widget from './widget';
import LawBrowserContainer from './lawBrowserContainer';
import { RecentActivityHOC, RecentActivityFullHOC, CompanyRecentActivityHOC, CompanyRecentActivityFullFromRouteHOC } from '../hoc/resources';

@connect(undefined,{
    navigate: (url) => push(url)
})
@RecentActivityHOC()
export class RecentActivityWidget extends React.Component {

    handleClick(activity) {
        if(activity.data.companyId){
            this.props.navigate('/company/view/'+activity.data.companyId)
        }
    }

    render() {
        const activities = this.props.recentActivity.data || [];
        return <Widget className="recent-activity-widget"  title="Recent Activity" iconClass="fa fa-clock-o" link="/recent_activity">
                <ul>
                { activities.map((a, i) => <li key={i} className="actionable" onClick={() => this.handleClick(a)}>
                        <span className="date">{stringDateToFormattedStringTime(a.createdAt)}</span> {a.description}
                </li>)}
                 { !activities.length && <li>No Recent Activity </li>}
                </ul>
        </Widget>
    }
}

@CompanyRecentActivityHOC()
export class RecentCompanyActivityWidget extends React.Component {

    render() {
        const activities = this.props.recentActivity.data || [];
        return <Widget title="Recent Activity" iconClass="fa fa-clock-o" link={`/company/view/${this.props.companyId}/recent_activity`}>
                <ul>
                { activities.map((a, i) => <li key={i}>
                    <span className="date">{stringDateToFormattedStringTime(a.createdAt)}</span> {a.description}
                </li>)}
                { !activities.length && <li>No Recent Activity </li>}
                </ul>
        </Widget>
    }
}

@CompanyRecentActivityFullFromRouteHOC(true)
export class CompanyRecentActivityFull extends React.Component {

    render() {
        const activities = this.props.recentActivity.data || [];
        return  <LawBrowserContainer>
            <Widget  title="Recent Activity" iconClass="fa fa-clock-o">
                <div className="table-responsive">
                <table className="table table-hover recent-activity-table">
                <thead><tr><th>Time & Date</th><th>User</th><th>Description</th></tr></thead>
                    <tbody>
                    {activities.map(
                        (row, i) => <tr key={i}>
                        <td>{stringDateToFormattedStringTime(row.createdAt)}</td>
                        <td>{row.username}</td>
                        <td>{row.description}</td>
                        </tr>) }
                    </tbody>
                </table>
                </div>
                </Widget>
            </LawBrowserContainer>

    }
}

@connect(undefined,{
    navigate: (url) => push(url)
})
@RecentActivityFullHOC(true)
export default class RecentActivity extends React.Component {

    handleClick(activity) {
        if(activity.data.companyId){
            this.props.navigate('/company/view/'+activity.data.companyId)
        }
    }

    render() {
        const activities = this.props.recentActivity.data || [];
        return  <LawBrowserContainer>
            <Widget  title="Recent Activity" iconClass="fa fa-clock-o">
                <div className="table-responsive">
                <table className="table table-hover recent-activity-table">
                <thead><tr><th>Time & Date</th><th>User</th><th>Description</th></tr></thead>
                    <tbody>
                    {activities.map(
                        (row, i) => <tr key={i} className="actionable" onClick={() => this.handleClick(row)}>
                        <td>{stringDateToFormattedStringTime(row.createdAt)}</td>
                        <td>{row.username}</td>
                        <td>{row.description}</td>
                        </tr>) }
                    </tbody>
                </table>
                </div>
                </Widget>
            </LawBrowserContainer>

    }
}
