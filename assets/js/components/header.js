"use strict"
import React from 'react'
import ReactDOM from 'react-dom'
import { pureRender }  from '../utils';
import { Link, IndexLink } from 'react-router';
import { connect } from 'react-redux';
import Actions from '../actions';
import Navbar from 'react-bootstrap/lib/Navbar'
import Collapse from 'react-bootstrap/lib/Collapse'
import NavbarHeader from 'react-bootstrap/lib/NavbarHeader';
import NavbarToggle from 'react-bootstrap/lib/NavbarToggle';
import NavbarCollapse from 'react-bootstrap/lib/NavbarCollapse';
import Dropdown from 'react-bootstrap/lib/Dropdown';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { numberWithCommas } from '../utils';
import { FavouritesHOC, AlertsHOC, CompaniesHOC  } from '../hoc/resources';
import { highlightString } from './search';

import RootCloseWrapper from 'react-overlays/lib/RootCloseWrapper';


@CompaniesHOC()
export class Search extends React.Component {
    constructor(props){
        super();
        this.onChange = ::this.onChange;
        this.hide = ::this.hide;
        this.show = ::this.show;
        this.setAndClose = ::this.setAndClose;
        this.state = {value: '', showing: false, list: []};
    }

    onChange(event) {
        const filterCompanies = (value, list) => {
            return !value ? [] : list.filter(l => l.currentCompanyState.companyName.toLocaleLowerCase().indexOf(value) > -1);
        }

        this.setState({show: true, value: event.target.value, list: filterCompanies(event.target.value.toLocaleLowerCase(), this.props.companies.data)});
    }

    hide(e) {
        this.setState({show: false})
    }

    show() {
        this.setState({show: true})
    }

    setAndClose(value) {
        this.setState({show: false, value: value})
    }

    results() {
        return  this.state.show && <div className="search-results" >
            { this.state.list.map((c, i) => {
                return <Link key={i} className="result" to={`/company/view/${c.id}`} onClick={() => this.setAndClose(c.currentCompanyState.companyName)}><span className="title">{ highlightString(c.currentCompanyState.companyName, this.state.value) }</span></Link>
            }) }
            </div>
    }

    render() {
        return <form className="search-form navbar-form" ref="form">
            <div className="form-group">
                  <RootCloseWrapper
                            onRootClose={this.hide}
                            event={'click'}
                          >
                <div className="input-group" >

                    <input  type="text" className="form-control" placeholder="Search..." value={this.state.value} onChange={this.onChange} onFocus={this.show}  />
                    { this.results() }
                    <span className="input-group-addon" >
                        <span className="fa fa-search"/>
                    </span>
                </div>
            </RootCloseWrapper>
        </div>
    </form>
    }
}


const DropdownToggle = (props) => {
    return <a href={props.href} onClick={(e) => {e.preventDefault(); props.onClick(e);}}>
        {props.children}
      </a>
}


export const AccountControls = (props) => {
    if(props.login.loggedIn){
        return <Dropdown id="update-dropdown" componentClass="li" className="control-icon">
                    <DropdownToggle href={props.login.userUrl} bsRole="toggle">
                        <span className="fa fa-user-circle"/>
                   </DropdownToggle>
                    <Dropdown.Menu bsRole="menu">
                        <MenuItem rel="noopener noreferrer" target="_blank" href={`${props.login.userUrl}/user/profile`}>Account</MenuItem>
                        <li className="last-login">Last login: {props.userInfo.lastLogin}</li>
                        <li  className="separator" />
                        <MenuItem rel="noopener noreferrer" target="_blank" href='https://browser.catalex.nz'>Law Browser</MenuItem>
                        <MenuItem rel="noopener noreferrer" target="_blank" href='https://workingdays.catalex.nz'>Working Days</MenuItem>
                        <MenuItem rel="noopener noreferrer" target="_blank" href='https://concat.catalex.nz'>ConCat</MenuItem>
                        <li  className="separator" />
                        <MenuItem href='/logout'>Log out</MenuItem>
                    </Dropdown.Menu>
                </Dropdown>
    }
    return false;
}



export class HeaderSubControls extends React.Component {

    render() {
            return <div className="nav-controls">
                <div className="full-controls">
                        <ul className="nav navbar-nav">
                            { NavLinks({}) }
                       </ul>
                    </div>
            </div>
    }

}

export const NavLinks = (props) => {
    return [<li key={0} className="nav-item">
                <IndexLink to={`/`} activeClassName="active" className="nav-link"  onClick={props.closeMenu}>Home</IndexLink>
            </li>,
            <li key={1} className="nav-item">
                <Link to={`/companies`} activeClassName="active" className="nav-link"  onClick={props.closeMenu}>Companies</Link>
            </li>,
            <li key={2} className="nav-item">
                <Link to={`/calendar`} activeClassName="active" className="nav-link"  onClick={props.closeMenu}>Calendar</Link>
            </li>,
            <li key={3} className="nav-item"><Link to={`/templates`} activeClassName="active" className="nav-link">Templates</Link></li>
         ];
}


@FavouritesHOC()
@AlertsHOC()
export class Header extends React.Component {

    constructor() {
        super();
        this.closeMenu = ::this.closeMenu;
    }

    renderNavLinks() {
        return NavLinks({closeMenu: this.closeMenu})
    }

    renderFavourites() {
        const items = this.props.favourites && (this.props.favourites.data || []);
        if(items && items.length){
           return [<li key={-1} className="separator" />].concat(items.map((f, i) => {
                return <li key={i}><Link to={`/company/view/${f.id}`} onClick={this.closeMenu}>{f.currentCompanyState.companyName}</Link></li>
           }));
       }
    }

    closeMenu() {
        this.refs.dropdown.refs.inner.handleClose()
    }

    status()  {
        if(this.props.alerts && this.props.alerts.data){
            const count = Object.keys(this.props.alerts.data.companyMap || {}).length;
            if(!count){
                return;
            }
            return <li  className="control-icon">
            <Link className="alerts-icon" to="/alerts"><span className="fa fa-bell-o"/>
            <span className="alerts-invert"><span className="alert-count">{ numberWithCommas(count) }</span></span>
            </Link>
        </li>
        }

    }


    render() {
        if(this.props.login.loggedIn){
            return  <Navbar>
                   <Navbar.Header>
                        <Navbar.Brand>
                            <Dropdown id="title-dropdown"  ref="dropdown">
                                <DropdownToggle href="/" bsRole="toggle">
                                            <span className="company-title">
                                             <span className="fa fa-bars"/>
                                                <span className="logo" />
                                            </span>
                                </DropdownToggle>
                                <Dropdown.Menu>
                                    <li><Link to="/" onClick={this.closeMenu}>Good Companies Home</Link></li>

                                     { this.renderNavLinks() }
                                    { this.renderFavourites() }
                                     <li className="separator" />
                                    <li>
                                        <a href={this.props.login.userUrl}>{this.props.userInfo.username}
                                        </a>
                                    </li>
                                    <li><a href="/logout">Log out</a></li>

                                </Dropdown.Menu>
                            </Dropdown>
                        </Navbar.Brand>
                    </Navbar.Header>


                         <ul  className="nav navbar-nav navbar-right control-icons">
                            { this.status() }
                            <AccountControls {...this.props} />
                        </ul>

                       <Search />



          </Navbar>
      }
      return <Navbar>

            <div className="text-center"><span className="logo"/></div></Navbar>


    }
}


const HeaderConnected = connect(state => {
     // adding routes so links update active status
    return {login: state.login, userInfo: state.userInfo, routing: state.routing, alerts: state.resources['/alerts'] || {}}
})(Header);

export default HeaderConnected;