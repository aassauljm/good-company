"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux'
import { asyncConnect } from 'redux-connect';
import { requestResource } from '../actions';
import { stringToDateTime } from '../utils'
import { Link } from 'react-router'


@connect((state, ownProps) => {
    return state.resources['/recent_activity'] || {};
}, {
    requestData: (key) => requestResource('/recent_activity'),
    navigate: (url) => push(url)
})
export class RecentActivityWidget extends React.Component {

    fetch() {
        return this.props.requestData();
    };
    componentDidMount() {
        this.fetch();
    };

    componentDidUpdate() {
        this.fetch();
    };

    handleClick(activity) {
        if(activity.data.companyId){
            this.props.navigate('/company/view/'+activity.data.companyId)
        }
    }

    render() {
        const activities = this.props.data || [];
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    Recent Activity
                </div>
                <div className="widget-control">
                <Link to="/recent_activity" >View All</Link>
                </div>
            </div>

            <div className="widget-body">
                <ul>
                { activities.map((a, i) => <li key={i} className="actionable" onClick={() => this.handleClick(a)}>
                        <span className="date">{stringToDateTime(a.createdAt)}</span> {a.description}
                </li>)}
                 { !activities.length && <li>No Recent Activity </li>}
                </ul>
            </div>
        </div>
    }
}

@connect((state, ownProps) => {
    return state.resources[`/company/${ownProps.companyId}/recent_activity`] || {};
}, {
    requestData: (key) => requestResource(`/company/${key}/recent_activity`),
    navigate: (url) => push(url)
})
export class RecentCompanyActivityWidget extends React.Component {

    fetch() {
        return this.props.requestData(this.props.companyId);
    };
    componentDidMount() {
        this.fetch();
    };

    componentDidUpdate() {
        this.fetch();
    };

    key() {
        return this.props.companyId;
    }

    render() {
        const activities = this.props.data || [];
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    Recent Activity
                </div>
                <div className="widget-control">
                { /* <Link to={`/company/view/${this.key()}/recent_activity`}>View All</Link> */ }
                </div>
            </div>

            <div className="widget-body">
                <ul>
                { activities.map((a, i) => <li key={i}>
                    <span className="date">{stringToDateTime(a.createdAt)}</span> {a.description}
                </li>)}
                { !activities.length && <li>No Recent Activity </li>}
                </ul>
            </div>
        </div>
    }
}


@asyncConnect([{
      promise: ({store: {dispatch, getState}, params}) => {
        return dispatch(requestResource('/recent_activity/full'))
      }
    }],
    state => state.resources['/recent_activity/full'],
    {
        navigate: (url) => push(url)
    })
export default class RecentActivity extends React.Component {
    handleClick(activity) {
        if(activity.data.companyId){
            this.props.navigate('/company/view/'+activity.data.companyId)
        }
    }

    render() {
        const activities = this.props.data || [];
        return <div className="container">
            <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    Recent Activity
                </div>
            </div>

            <div className="widget-body">
                <div className="table-responsive">
                <table className="table table-hover">
                <thead><tr><th>Time & Date</th><th>Description</th></tr></thead>
                    <tbody>
                    {activities.map(
                        (row, i) => <tr key={i} className="actionable" onClick={() => this.handleClick(row)}>
                        <td>{stringToDateTime(row.createdAt)}</td>
                        <td>{row.description}</td>
                        </tr>) }
                    </tbody>
                </table>
                </div>
            </div>
            </div>
        </div>
    }
}
