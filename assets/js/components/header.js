"use strict"
import React from 'react'
import { pureRender }  from '../utils';
import { Link } from 'react-router';
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
export default class Header extends React.Component {
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
                <Link activeClassName="active" className="nav-link username" to={"/user/edit/"+this.props.userInfo.id}>{this.props.userInfo.username}
                </Link>
            </li>;
        }
    }

    showLogin() {
        if(!this.props.loggedIn){
            return <li className="nav-item">
                <Link activeClassName="active" className="nav-link" to={"/login"}>Login</Link>
            </li>;
        }
    }

    showSignUp() {
        if(!this.props.loggedIn){
            return <li className="nav-item">
                <Link activeClassName="active" className="nav-link" to={"/signup"}>Sign Up</Link>
            </li>;
        }
    }

    showLogout() {
        return  this.props.loggedIn ? <li className="nav-item"><a className="nav-link" href="/logout">Log out</a></li> : null;
    }


    render() {
        return  <Navbar>
                <NavbarHeader>
                <Link to="/" className="navbar-brand"><span>Good Company</span></Link>
                    <NavbarToggle />
                </NavbarHeader>

             <NavbarCollapse>

                <ul className="nav navbar-nav navbar-right">
                { this.showAccount() }
                { this.showLogout() }
                { this.showLogin() }
                { this.showSignUp() }
                </ul>


         </NavbarCollapse>
  </Navbar>

    }
}

