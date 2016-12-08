"use strict"
import React, { PropTypes } from 'react'
import { pureRender }  from '../utils';
import { Link, IndexLink, withRouter } from 'react-router';
import Navbar from 'react-bootstrap/lib/Navbar'
import Collapse from 'react-bootstrap/lib/Collapse'
import NavbarHeader from 'react-bootstrap/lib/NavbarHeader';
import NavbarToggle from 'react-bootstrap/lib/NavbarToggle';
import NavbarCollapse from 'react-bootstrap/lib/NavbarCollapse';
import Dropdown from 'react-bootstrap/lib/Dropdown';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import { addNotification, createResource, deleteResource } from '../actions';
import { connect } from 'react-redux';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { push } from 'react-router-redux';
import moment from 'moment'
import { FavouritesHOC } from '../hoc/resources';


const DropdownToggle = (props) => {
    return <Link to={props.href} onClick={(e) => {e.preventDefault(); props.onClick(e);}} activeClassName="active" className={props.className} >
        {props.children}
      </Link>
}

@FavouritesHOC()
@connect((state, ownProps) => ({login: state.login, userInfo: state.userInfo, routing: state.routing, favourite: state.resources[`/favourites/${ownProps.companyId}`]}), {
    navigate: (url) => push(url),
    addFavourite: (id) => createResource(`/favourites/${id}`,  null, {invalidates: ['/favourites']}),
    removeFavourite: (id) => deleteResource(`/favourites/${id}`, {invalidates: ['/favourites']})
})
export default class CompanyHeader extends React.Component {
    closeMenu() {
        // ugly ugly
        //this.refs.dropdown.refs.inner.handleClose()
    }

    isFavourite() {
        const companyIdInt = parseInt(this.props.companyId, 10);
        // save result maybe
        return (this.props.favourites.data || []).filter(f => f.id === companyIdInt && f.favourite).length;
    }

    toggleFavourite() {
        (this.isFavourite() ? this.props.removeFavourite(this.props.companyId) : this.props.addFavourite(this.props.companyId))
            .then(response => {

            })
            .catch(e => {
                this.props.addNotification({error: true, message: this.isFavourite() ? 'Could not remove Favourite' : 'Could not add Favourite.'})
            })
    }

    renderRightActions() {
        let glyph = this.isFavourite() ? 'fa fa-star' : 'fa fa-star-o';
        let className = ''
        if(this.props.favourites._status === 'fetching' || (this.props.favourite && this.props.favourite._status === 'fetching')){
            glyph = 'fa fa-spinner spin';
        }
        return [<div key={0} className="favourite">
            <a className="favourite actionable" href="#" onClick={() => this.toggleFavourite()}>
            <span className="visible-lg-inline">Favourite</span>
            <span className={glyph}/>
            </a>
        </div>]
    }

    renderNavLinks() {
        const id = this.props.companyId;

        return [ <li key={-1} className="nav-item separator" />,
                <li key={0} className="nav-item">
                    <IndexLink to={this.props.baseUrl} activeClassName="active" className="nav-link"  onClick={this.closeMenu}>Dashboard</IndexLink>
                </li>,

            <Dropdown key={1} id="register-dropdown" className="nav-item" componentClass="li" >
                    <DropdownToggle href={`${this.props.baseUrl}/registers`} bsRole="toggle">
                        Registers
                   </DropdownToggle>
                    <Dropdown.Menu bsRole="menu">
                        <MenuItem onClick={() => this.props.navigate(`${this.props.baseUrl}/registers/shareregister`)}><span className="fa fa-book"/>Share Register</MenuItem>
                        <MenuItem  onClick={() => this.props.navigate(`${this.props.baseUrl}/registers/interests_register`)}><span className="fa fa-book"/>Interests Register</MenuItem>
                        </Dropdown.Menu>
                </Dropdown>,

              <Dropdown key={3} id="update-dropdown" className="nav-item" componentClass="li">
                    <DropdownToggle href={`${this.props.baseUrl}/new_transaction`} bsRole="toggle">
                        Update
                   </DropdownToggle>
                    <Dropdown.Menu bsRole="menu">
                        <MenuItem onClick={() => this.props.navigate(`${this.props.baseUrl}/new_transaction/contact`) }><span className="fa fa-envelope"/> Contact</MenuItem>
                        <MenuItem onClick={() => this.props.navigate(`${this.props.baseUrl}/new_transaction/people`) }><span className="fa fa-users"/> People</MenuItem>
                        <MenuItem onClick={() => this.props.navigate(`${this.props.baseUrl}/new_transaction/shares`) }><span className="fa fa-exchange"/> Shares</MenuItem>
                        <MenuItem onClick={() => this.props.navigate(`${this.props.baseUrl}/new_transaction/reset_delete`) }><span className="fa fa-trash-o"/> Reset or Delete</MenuItem>
                        </Dropdown.Menu>
                </Dropdown>,
             <li key={4} className="nav-item"><Link to={`${this.props.baseUrl}/templates`} onClick={() => this.closeMenu()} activeClassName="active" className="nav-link">Templates</Link></li>,
             ]
    }
     render() {
        return <div className="container">
            <div className="nav-controls">

                    <div className="company-summary">
                        <h1> { this.props.companyState.companyName}</h1>
                        { this.props.companyState.transaction && <h2> as at { moment(this.props.companyState.transaction.effectiveDate).format('hh:mm a D MMMM YYYY') } </h2> }
                        { !this.props.companyState.transaction && <h2> as at { moment(this.props.companyState.incorporationDate).format('hh:mm a D MMMM YYYY') } </h2> }
                    </div>
                    <div className="full-controls">
                        <ul className="nav navbar-nav">
                        { this.renderNavLinks() }
                       </ul>

                      <ul className="nav navbar-nav pull-right">
                             { this.renderRightActions() }
                        </ul>
                    </div>

                    <div className="small-controls">
                                         <ul className="nav navbar-nav">
                        <Dropdown id="menu-dropdown" className="nav-item" componentClass="li">
                           <DropdownToggle href={`/company/view/${this.props.companyId}`} className="active" bsRole="toggle">Menu</DropdownToggle>
                        <Dropdown.Menu bsRole="menu">
                                 { this.renderNavLinks() }
                            </Dropdown.Menu>
                     </Dropdown>
                     </ul>

                      <ul className="nav navbar-nav pull-right">
                             { this.renderRightActions() }
                        </ul>

                    </div>

            </div>

            </div>
        }
}
