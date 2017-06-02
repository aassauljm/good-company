"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux'
import { asyncConnect } from 'redux-connect';
import { requestResource } from '../actions';
import { stringDateToFormattedStringTime } from '../utils';
import { Link } from 'react-router';
import STRINGS from '../strings';
import { addNotification, createResource, deleteResource } from '../actions';
import { CompaniesHOC } from '../hoc/resources';


export class FavouriteControlUnconnected extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {}
    }
    isFavourite() {
        const companyIdInt = parseInt(this.props.companyId, 10);
        // save result maybe
        return (this.props.companies.data || []).filter(f => f.id === companyIdInt && f.favourite).length;
    }

    toggleFavourite(e) {
        if(this.props.action === false){
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        this.setState({loading: true});
        (this.isFavourite() ? this.props.removeFavourite(this.props.companyId) : this.props.addFavourite(this.props.companyId))
            .then(response => {
                return this.props.fetch(true)
                    .then(() => {
                        this.setState({loading: false})
                    })
            })
            .catch(e => {
                this.props.addNotification({error: true, message: this.isFavourite() ? 'Could not remove Favourite' : 'Could not add Favourite.'})
            })
    }

    render() {
        let glyph = this.isFavourite() ? 'fa fa-star' : 'fa fa-star-o';
        let className = ''
        if(this.state.loading || (this.props.favourite && this.props.favourite._status === 'fetching')){
            glyph = 'fa fa-spinner spin';

        }
        return <a className="favourite actionable" href="#" onClick={(e) => this.toggleFavourite(e)}>
                { this.props.showLabel && <span className="visible-lg-inline">Favourite</span> }
                <span className={glyph}/>
                </a>
    }
}


export function ConnectFavourites(component){
    return CompaniesHOC()(connect((state, ownProps) => ({favourite: state.resources[`/favourites/${ownProps.companyId}`]}),
    (dispatch) => ({
        navigate: (url) => { dispatch(push(url)); dispatch(endTransactionView()) },
        addFavourite: (id) => dispatch(createResource(`/favourites/${id}`,  null, {invalidates: []})),
        removeFavourite: (id) => dispatch(deleteResource(`/favourites/${id}`, {invalidates: []})),
        addNotification: (...args) => dispatch(addNotification(...args))
    }))(component))
}

const FavouriteControl = ConnectFavourites(FavouriteControlUnconnected);
export default FavouriteControl;

