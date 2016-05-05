"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { routeActions } from 'react-router-redux'
import { asyncConnect } from 'redux-async-connect';
import { requestResource } from '../actions';
import { stringToDateTime } from '../utils'
import { Link } from 'react-router'


@connect((state, ownProps) => {
    return state.resources['/recent_activity'] || {};
}, {
    requestData: (key) => requestResource('/recent_activity'),
    navigate: (url) => routeActions.push(url)
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
                </ul>
            </div>
        </div>
    }
}


@asyncConnect([{
  promise: ({store: {dispatch, getState}, params}) => {
    return dispatch(requestResource('/recent_activity/full'))
  }
}])
@connect(state => state.resources['/recent_activity/full'])
export default class RecentActivity extends React.Component {
    handleClick(activity) {
        if(activity.data.companyId){
            this.props.navigate('/company/view/'+activity.data.companyId)
        }
    }

    render() {
        const activities = this.props.data || [];
        return <div className="container"><table className="table">
        <thead><tr><th>Time & Date</th><th>Description</th></tr></thead>
            <tbody>
            {activities.map(
                (row, i) => <tr key={i}>
                <td>{stringToDateTime(row.createdAt)}</td>
                <td>{row.description}</td>
                </tr>) }
            </tbody>
        </table>
        </div>
    }

}
