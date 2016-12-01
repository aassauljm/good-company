"use strict"
import React from 'react'
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
import { FavouritesHOC, AlertsHOC  } from '../hoc/resources';


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



@FavouritesHOC()
@AlertsHOC()
export class Header extends React.Component {

    constructor() {
        super();
        this.closeMenu = ::this.closeMenu;
    }

    renderNavLinks() {
        return [<li key={0} className="nav-item">
                    <IndexLink to={`/`} activeClassName="active" className="nav-link"  onClick={this.closeMenu}>Home</IndexLink>
                </li>,
                <li key={1} className="nav-item">
                    <Link to={`/companies`} activeClassName="active" className="nav-link"  onClick={this.closeMenu}>Companies</Link>
                </li>,
                <li key={2} className="nav-item">
                    <Link to={`/calendar`} activeClassName="active" className="nav-link"  onClick={this.closeMenu}>Calendar</Link>
                </li>,

                <li key={3} className="nav-item"><Link to={`/templates`} activeClassName="active" className="nav-link">Templates</Link></li>
             ]
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


    search() {
        return <form className="search-form navbar-form">
            <div className="form-group">
                <div className="input-group">
                    <input  type="text" className="form-control" placeholder="Search..."/>
                    <span className="input-group-addon" >
                            <span className="fa fa-search"/>
                    </span>
                </div>
            </div>
            </form>
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

                        { this.search() }



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