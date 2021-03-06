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
import { CompaniesHOC, AlertsHOC } from '../hoc/resources';
import { Search } from './search';
import { alertList } from './alerts';


const DropdownToggle = (props) => {
    return <a href={props.href} onClick={(e) => {e.preventDefault(); props.onClick(e);}}>
        {props.children}
      </a>
}


export class AccountControls extends React.Component {
    render() {
        const props = this.props;
        const close = () => this.refs.dropdown.refs.inner.handleClose()
        if(props.login.loggedIn){
            return <Dropdown id="account-dropdown" componentClass="li" className="control-icon" ref="dropdown">
                        <DropdownToggle href={props.login.userUrl} bsRole="toggle">
                            <span className="fa fa-user-circle"/>
                       </DropdownToggle>
                        <Dropdown.Menu bsRole="menu">
                            <MenuItem rel="noopener noreferrer" target="_blank" href={`${props.login.userUrl}/user/profile`}>Account Settings</MenuItem>
                            <li><Link to={`/account_settings`} onClick={close}>Email Settings</Link></li>
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
                <IndexLink to={`/`} activeClassName="active" className="nav-link"  onClick={props.closeMenu}>Good Companies Home</IndexLink>
            </li>,
            <li key={1} className="nav-item">
                <Link to={`/companies`} activeClassName="active" className="nav-link"  onClick={props.closeMenu}>Companies</Link>
            </li>,
            <li key={2} className="nav-item"><Link to={`/calendar`} activeClassName="active" className="nav-link"  onClick={props.closeMenu}>Calendar</Link></li>,
            <li key={3} className="nav-item"><Link to={`/templates`} activeClassName="active" className="nav-link" onClick={props.closeMenu}>Templates</Link></li>,
            props.canImport && <li key={4} className="nav-item"><Link to={`/import`} activeClassName="active" className="nav-link" onClick={props.closeMenu}>Import</Link></li>,
            <li key={5} className="nav-item"><Link to={`/recent_activity`} activeClassName="active" className="nav-link" onClick={props.closeMenu}>Recent Activity</Link></li>,
            <li key={6} className="nav-item"><Link to={`/alerts`} activeClassName="active" className="nav-link" onClick={props.closeMenu}>Notifications</Link></li>
         ];
}


@CompaniesHOC()
@AlertsHOC()
export class HeaderUser extends React.PureComponent {

    constructor() {
        super();
        this.closeMenu = ::this.closeMenu;
    }

    renderNavLinks() {
         const canImport = this.props.userInfo.permissions.company.indexOf('create') >= 0;
        return NavLinks({closeMenu: this.closeMenu, canImport})
    }

    renderFavourites() {
        const items = (this.props.companies && (this.props.companies.data || [])).filter(f => f.favourite);
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
            const {danger, warnings} = alertList(this.props);
            const results = [...danger, ...warnings]
            const count = results.length;

            return <li  className="control-icon">
            <Link className="alerts-icon" to="/alerts"><span className="fa fa-bell-o"/>
            <span className="alerts-invert"><span className="alert-count">{ numberWithCommas(count) }</span></span>
            </Link>
        </li>
        }

    }


    render() {
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
                                 { this.renderNavLinks() }
                                { this.renderFavourites() }
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
}

function HeaderNoUser() {
    return <Navbar>
        <div className="text-center"><span className="logo"/>
        </div>
    </Navbar>
}


@connect(state => {
     // adding routes so links update active status
    return {login: state.login, userInfo: state.userInfo, routing: state.routing, alerts: state.resources['/alerts'] || {}}
})
export default class Header extends React.PureComponent {
    render(){
        if(this.props.login.loggedIn){
            return <HeaderUser {...this.props} />
        }
        return <HeaderNoUser />
    }
}