"use strict"
import React, { PropTypes } from 'react'
import { pureRender }  from '../utils';
import { Link, IndexLink } from 'react-router';
import Actions from '../actions';
import Navbar from 'react-bootstrap/lib/Navbar'
import Collapse from 'react-bootstrap/lib/Collapse'
import NavbarHeader from 'react-bootstrap/lib/NavbarHeader';
import NavbarToggle from 'react-bootstrap/lib/NavbarToggle';
import NavbarCollapse from 'react-bootstrap/lib/NavbarCollapse';
import Dropdown from 'react-bootstrap/lib/Dropdown';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import { requestUserInfo } from '../actions';
import { connect } from 'react-redux';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { routeActions } from 'react-router-redux'

export class CompanyHeader extends React.Component {

    static propTypes = {
        companyState: PropTypes.object.isRequired,
        companyId: PropTypes.string.isRequired,
        userInfo: PropTypes.object.isRequired
    };

    showAccount() {
        if(this.props.userInfo && this.props.userInfo.username){
            return <li className="nav-item">
                <Link activeClassName="active" className="nav-link username" to={"/user/edit/"+this.props.userInfo.id}>{this.props.userInfo.username}
                </Link>
            </li>;
        }
    }

    showLogout() {
        return  <li className="nav-item"><a className="nav-link" href="/logout">Log out</a></li>
    }

    showMenus() {
        //Dashboard (default first page), Share Register, Interests Register, Update Company, Templates
        const id = this.props.companyId;
        return <ul className="nav navbar-nav">
             <li className="nav-item"><IndexLink to={`/company/view/${id}`} activeClassName="active" className="nav-link">Dashboard</IndexLink></li>
             <li className="nav-item"><Link to={`/company/view/${id}/shareregister`} activeClassName="active" className="nav-link">Share Register</Link></li>
             <li className="nav-item"><Link to={`/company/view/${id}/interests_register`} activeClassName="active" className="nav-link">Interests Register</Link></li>
             <li className="nav-item"><Link to={`/company/view/${id}/new_transaction`} activeClassName="active" className="nav-link">Update Company</Link></li>
             <li className="nav-item"><Link to={`/company/view/${id}/templates`} activeClassName="active" className="nav-link">Templates</Link></li>
        </ul>
    }

    render() {
        return  <Navbar>


            <div className="navbar-top">
            <Navbar.Header>
                <Navbar.Brand>

                    <Dropdown id="title-dropdown">
                      <a href="#" onClick={e => e.preventDefault}  bsRole="toggle">
                       <span className="company-title"><Glyphicon glyph='menu-hamburger'/> {this.props.companyState.companyName}</span>
                       </a>
                      <Dropdown.Menu className="super-colors">
                      <MenuItem eventKey="1" onClick={() => this.props.dispatch(routeActions.push('/'))}>Home</MenuItem>
                        <MenuItem header>My Companies</MenuItem>
                        <MenuItem eventKey="2">Blue</MenuItem>
                        <MenuItem eventKey="3">Orange</MenuItem>
                        <MenuItem eventKey="1">Red-Orange</MenuItem>
                      </Dropdown.Menu>
                    </Dropdown>
                    </Navbar.Brand>
                </Navbar.Header>

            <ul className="nav navbar-nav navbar-right">
                { this.showAccount() }
                { this.showLogout() }
            </ul>
            </div>
            <div className="navbar-bottom">
            <NavbarCollapse>
                 {this.showMenus() }
            </NavbarCollapse>
            </div>
      </Navbar>

    }
};



const CompanyHeaderConnected = connect(state => { return { userInfo: state.userInfo, routing: state.routing} })(CompanyHeader);

export default CompanyHeaderConnected;