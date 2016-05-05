"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { routeActions } from 'react-router-redux'
import { asyncConnect } from 'redux-async-connect';
import { requestResource } from '../actions';
import { stringToDateTime } from '../utils';
import { Link } from 'react-router';


@connect((state, ownProps) => {
    return state.resources['/favourites'] || {};
}, {
    requestData: (key) => requestResource('/favourites'),
    navigate: (url) => routeActions.push(url)
})
export class FavouritesWidget extends React.Component {

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

        }
    }

    render() {
        const favourites = this.props.data || [];
        return <div className="widget favourites">
            <div className="widget-header">
                <div className="widget-title">
                    Favourites
                </div>
                <div className="widget-control">
                <Link to="/favourites" >View All</Link>
                </div>
            </div>

            <div className="widget-body">
                <ul>
                {favourites.map((f, i) => <li>
                    <Link to={`/company/view/${f.id}`}>
                    <span className="company-name">{f.currentCompanyState.companyName } </span>
                    <span className="extra">Company Number: {f.currentCompanyState.companyNumber } </span>
                    <span className="extra">NZBN: {f.currentCompanyState.nzbn } </span>
                    </Link>

                </li>)}
                </ul>
            </div>
        </div>
    }
}