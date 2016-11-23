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
        return <div><ul  className="nav navbar-nav navbar-right">

              <Dropdown id="update-dropdown" className="nav-item" componentClass="li">
                    <DropdownToggle href={props.login.userUrl} bsRole="toggle">
                        {props.userInfo.username}
                   </DropdownToggle>
                    <Dropdown.Menu bsRole="menu">
                        <MenuItem href={`${props.login.userUrl}/user/profile`}>Account</MenuItem>
                        <li  className="separator" />
                        <MenuItem href='https://browser.catalex.nz'>Law Browser</MenuItem>
                        <MenuItem href='https://workingdays.catalex.nz'>Working Days</MenuItem>
                        <MenuItem href='https://concat.catalex.nz'>ConCat</MenuItem>
                        <li  className="separator" />
                        <MenuItem href='/logout'>Log out</MenuItem>
                    </Dropdown.Menu>
                </Dropdown>
        </ul>
        <ul key={1} className="nav navbar-nav navbar-right clear-right">
                    <li className="nav-item"><em>Last login: {props.userInfo.lastLogin}</em></li>
     </ul></div>
    }
    return false;
}



@AlertsHOC
@FavouritesHOC
export class Header extends React.Component {

    renderNavLinks() {
        return [<li key={-1} className="nav-item separator" />, <li key={0} className="nav-item">
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
        const items = (this.props.favourites.data || []);
        if(items.length){
           return [<li key={-1} className="separator" />].concat(items.map((f, i) => {
                return <li key={i}><Link to={`/company/view/${f.id}`} onClick={this.closeMenu}>{f.currentCompanyState.companyName}</Link></li>
           }));
       }
    }

    status()  {
        if(this.props.alerts && this.props.alerts.data){
            const count = Object.keys(this.props.alerts.data.companyMap || {}).length;
            if(!count){
                return;
            }
            return <li key={0} className="nav-item">
            <Link className="alerts-icon" to="/alerts"><span className="fa fa-bell-o"/>
            <span className="alerts-invert"><span className="alert-count">{ numberWithCommas(count) }</span></span>
            </Link>
        </li>
        }
        //f

    }

    render() {
        if(this.props.login.loggedIn){
            return  <Navbar>
                <div className="navbar-top">
                   <Navbar.Header>

                        <Navbar.Brand>
                            <Dropdown id="title-dropdown"  ref="dropdown">
                                <DropdownToggle href="/" bsRole="toggle">
                                            <span className="company-title">
                                            <Glyphicon glyph='menu-hamburger'/>
                                             <span className="logo" /><span className="text-logo">Good Companies</span>
                                        </span>

                                </DropdownToggle>
                                <Dropdown.Menu>
                                    <li><Link to="/">Good Companies Home</Link></li>

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
                    <NavbarCollapse>
                        <AccountControls {...this.props}/>
                    </NavbarCollapse>

                </div>
                <div className="navbar-bottom">
                <NavbarCollapse>
                     <ul className="nav navbar-nav">
                         { this.renderNavLinks() }
                       </ul>
                       <ul className="nav navbar-nav pull-right">
                        { this.status() }
                       </ul>
                </NavbarCollapse>
                </div>
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