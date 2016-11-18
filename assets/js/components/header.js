"use strict"
import React from 'react'
import { pureRender }  from '../utils';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import Actions from '../actions';
import Navbar from 'react-bootstrap/lib/Navbar'
import Collapse from 'react-bootstrap/lib/Collapse'
import NavbarHeader from 'react-bootstrap/lib/NavbarHeader';
import NavbarToggle from 'react-bootstrap/lib/NavbarToggle';
import NavbarCollapse from 'react-bootstrap/lib/NavbarCollapse';



function RoleAllows(roles = [], menu){
    let rules = {
        "admin": {
            "users": true,
            "documents": true,
            "companies": true
        },
        "registered": {
            "documents": false,
            "companies": false
        }
    }
    for(let role of roles){
        if(role.active && rules[role.name] && rules[role.name][menu]){
            return true;
        }
    }
}

/** Can't be pure, because router Links use context to show active */
export class Header extends React.Component {
    users() {
        if(this.props.userInfo && RoleAllows(this.props.userInfo.roles, 'users' )){
            return <li className="nav-item">
                <Link activeClassName="active" className="nav-link nav-users" to="/users">Users
                </Link>
            </li>;
        }
    }

    documents() {
        if(this.props.userInfo && RoleAllows(this.props.userInfo.roles, 'documents' )){
            return <li className="nav-item">
                <Link activeClassName="active" className="nav-link nav-documents" to="/documents">Documents
                </Link>
            </li>;
        }
    }

    companies() {
        if(this.props.userInfo && RoleAllows(this.props.userInfo.roles, 'companies' )){
            return <li className="nav-item">
                <Link activeClassName="active" className="nav-link nav-companies" to="/companies">Companies
                </Link>
            </li>;
        }
    }

    showMenus() {
        return <ul className="nav navbar-nav">
            { this.users() }
            { this.companies() }
            { this.documents() }
        </ul>
    }

    showAccount() {
        if(this.props.loggedIn && this.props.userInfo && this.props.userInfo.username){
            return <li className="nav-item">
                <a href={this.props.userUrl} className="nav-link">{this.props.userInfo.username}
                </a>
            </li>;
        }
    }

    showLogin() {
        if(!this.props.loggedIn){
            return <li className="nav-item">
            <a href={this.props.loginUrl} className="nav-link">Login</a>
            </li>;
        }
    }

    showSignUp() {
        if(!this.props.loggedIn){
            return <li className="nav-item">
                <a href={this.props.loginUrl} className="nav-link">Sign Up</a>
            </li>;
        }
    }

    showLogout() {
        return  this.props.loggedIn ? <li className="nav-item"><a className="nav-link" href="/logout">Log out</a></li> : null;
    }

    isLoggedIn() {
        return this.props.loggedIn && this.props.userInfo && this.props.userInfo.username;
    }

    render() {
        return  <Navbar>
                <NavbarHeader>
                <Link to="/" className="navbar-brand"><span>Good Companies</span></Link>
                    <NavbarToggle />
                </NavbarHeader>

             <NavbarCollapse>


                <ul className="nav navbar-nav navbar-right">
                { this.showAccount() }
                { this.showLogout() }
                { this.showLogin() }
                { this.showSignUp() }
                </ul>

                { this.isLoggedIn() &&
                    <ul className="nav navbar-nav navbar-right clear-right">
                    <li className="nav-item"><em>Last login: {this.props.userInfo.lastLogin}</em></li>
                </ul>}

         </NavbarCollapse>
  </Navbar>

    }
}


function HeaderWithProps(props){
    return <Header {...props.login } userInfo={ props.userInfo } />
}

const HeaderConnected = connect(state => { return {login: state.login, userInfo: state.userInfo} })(HeaderWithProps);
export default HeaderConnected;