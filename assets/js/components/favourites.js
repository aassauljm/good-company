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
import Widget from './widget';
import LawBrowserContainer from './lawBrowserContainer';


@connect(undefined, {
    navigate: (url) => push(url)
})
@FavouritesHOC(false)
@CompaniesHOC(false)
export class FavouritesWidget extends React.PureComponent {
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

        const fields = ['id', 'companyName', 'companyNumber', 'nzbn'];
        return <table className="table table-striped table-hover table-condensed">
            <thead><tr>{ fields.map(f => <th key={f}>{STRINGS[f]}</th>) }</tr></thead>
            <tbody>
            { favourites.map(
                (row, i) => <tr key={i} onClick={(e) => handleClick(e, row.id) }>
                    { fields.map(f => <td key={f}>{{...row.currentCompanyState, ...row}[f]}</td>) }
                </tr>) }
            </tbody>
        </table>
    }

    render() {
        return <Widget className="favourites" title="Favourites" iconClass="fa fa-star-o" link="/favourites">
                { this.renderTable() }
                </Widget>
    }
}


@connect(undefined, {
    navigate: (url) => push(url)
})
@FavouritesHOC(true)
@CompaniesHOC(true)
export default class Favourites extends React.PureComponent {

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
        return <LawBrowserContainer>
            <Widget className="favourites" title="Favourites" iconClass="fa fa-star-o">
               <div className="table-responsive">
                { this.renderTable() }
                </div>
                </Widget>
            </LawBrowserContainer>
    }
}