"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux'
import { asyncConnect } from 'redux-connect';
import { requestResource } from '../actions';
import { stringDateToFormattedStringTime } from '../utils';
import { Link } from 'react-router';
import STRINGS from '../strings';



@connect((state, ownProps) => {
    return state.resources['/favourites'] || {};
}, {
    requestData: (key) => requestResource('/favourites'),
    navigate: (url) => push(url)
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

    render() {
        const favourites = this.props.data || [];
        return <div className="widget favourites">
            <div className="widget-header">
                <div className="widget-title">
                    <span className="fa fa-star-o"/> Favourites
                </div>
                <div className="widget-control">
                <Link to="/favourites" >View All</Link>
                </div>
            </div>

            <div className="widget-body">
                <ul>
                {favourites.map((f, i) => <li key={i}>
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


@connect((state, ownProps) => {
    return state.resources['/favourites'] || {};
}, {
    requestData: (key) => requestResource('/favourites'),
    navigate: (url) => push(url)
})
export default class Favourites extends React.Component {

    fetch() {
        return this.props.requestData();
    };
    componentDidMount() {
        this.fetch();
    };

    componentDidUpdate() {
        this.fetch();
    };


    renderTable() {
        const handleClick = (event, id) => {
            event.preventDefault();
            this.props.navigate(`/company/view/${id}`);
        }
        const favourites = this.props.data || [];
        const fields = ['id', 'companyName', 'companyNumber', 'nzbn'];
        return <table className="table table-striped table-hover">
            <thead><tr>{ fields.map(f => <th key={f}>{STRINGS[f]}</th>) }</tr></thead>
            <tbody>
            { favourites.map(
                (row, i) => <tr key={i} onClick={(e) => handleClick(e, row.id) }>
                    { fields.map(f => <td key={f}>{row.currentCompanyState[f]}</td>) }
                </tr>) }
            </tbody>
        </table>
    }

    render() {

        return <div className="container">
        <div className="widget favourites">
            <div className="widget-header">
                <div className="widget-title">
                    Favourites
                </div>
            </div>

            <div className="widget-body">
                <div className="table-responsive">
                 { this.renderTable() }
                </div>
            </div>
        </div>
        </div>
    }
}