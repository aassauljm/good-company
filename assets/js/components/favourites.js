"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux'
import { asyncConnect } from 'redux-connect';
import { requestResource } from '../actions';
import { stringDateToFormattedStringTime } from '../utils';
import { Link } from 'react-router';
import STRINGS from '../strings';
import { FavouritesHOC, CompaniesHOC } from '../hoc/resources';

@connect(undefined, {
    navigate: (url) => push(url)
})
@FavouritesHOC(false)
@CompaniesHOC(false)
export class FavouritesWidget extends React.Component {
    renderList() {
        const favourites = this.props.favourites.data || [];
        return <ul>
                {favourites.map((f, i) => <li key={i}>
                    <Link to={`/company/view/${f.id}`}>
                    <span className="company-name">{f.currentCompanyState.companyName } </span>
                    <span className="extra">Company Number: {f.currentCompanyState.companyNumber } </span>
                    <span className="extra">NZBN: {f.currentCompanyState.nzbn } </span>
                    </Link>

                </li>)}
                </ul>
    }

    renderTable() {
        const handleClick = (event, id) => {
            event.preventDefault();
            this.props.navigate(`/company/view/${id}`);
        }
        let favourites = this.props.favourites.data || [];
        if(this.props.favourites._status === 'complete' && !favourites.length){
            favourites = (this.props.companies.data || []).slice(0, 10)
        }
        favourites = favourites.slice(0, 6);

        const fields = ['companyName', 'companyNumber', 'nzbn'];
        return <table className="table table-striped table-hover table-condensed">
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
                { this.renderTable() }
            </div>
        </div>
    }
}


@connect(undefined, {
    navigate: (url) => push(url)
})
@FavouritesHOC(true)
@CompaniesHOC(true)
export default class Favourites extends React.Component {

    renderTable() {
        const handleClick = (event, id) => {
            event.preventDefault();
            this.props.navigate(`/company/view/${id}`);
        }
        let favourites = this.props.favourites.data || [];
        if(this.props.favourites._status === 'complete' && !favourites.length){
            favourites = (this.props.companies.data || []).slice(0, 10)
        }
        const fields = ['companyName', 'companyNumber', 'nzbn'];
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