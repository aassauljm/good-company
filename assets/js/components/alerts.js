"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux'
import { asyncConnect } from 'redux-async-connect';
import { requestResource } from '../actions';
import { stringToDateTime } from '../utils';
import { Link } from 'react-router';


@connect((state, ownProps) => {
    return state.resources['/alerts'] || {};
}, {
    requestData: (key) => requestResource('/alerts'),
    navigate: (url) => push(url)
})
export class AlertsWidget extends React.Component {

    fetch() {
        //return this.props.requestData();
    };
    componentDidMount() {
        this.fetch();
    };

    componentDidUpdate() {
        this.fetch();
    };

    handleClick(activity) {
        if(activity.data.companyId){

        }
    }

    render() {
        const activities = this.props.data || [];
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    Notifications
                </div>
                <div className="widget-control">
                <Link to="/alerts" >View All</Link>
                </div>
            </div>

            <div className="widget-body">
                <ul>
                    No current Notifications
                </ul>
            </div>
        </div>
    }
}