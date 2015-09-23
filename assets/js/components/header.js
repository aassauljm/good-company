"use strict"
import React from 'react'
import pureRender from 'pure-render-decorator';
import Router from 'react-router'
import { Navbar, Nav, NavItem,  DropdownButton, MenuItem} from 'react-bootstrap';
import { Link } from 'react-router';
import Actions from '../actions';


function RoleAllows(roles = [], menu){
    let rules = {
        "admin": {
            "users": true,
            "companies": true,
        },
        "registered": {

        }
    }
    for(let role of roles){
        if(role.active && rules[role.name] && rules[role.name][menu]){
            return true;
        }
    }
}


@pureRender
export default class Main extends React.Component {

    users(){
        if(this.props.userInfo && RoleAllows(this.props.userInfo.roles, 'users' )){
            return <li className="nav-item">
                <Link activeClassName="active" className="nav-link" to="/users">Users
                </Link>
            </li>;
        }
    }

    showMenus(){
        return  <Nav>
            { this.users() }
        </Nav>
    }

    showAccount(){
        if(this.props.userInfo){
            return <li className="nav-item">
                <Link activeClassName="active" className="nav-link" to="account">{this.props.userInfo.username}
                </Link>
            </li>;
        }
    }

    showLogout(){
        return  this.props.loggedIn ? <li className="nav-item"><a className="nav-link" href="logout">Log out</a></li> : null;
    }

    render() {
        return  <Navbar brand='Title' className="navbar-dark bg-inverse">
                {this.showMenus() }
                <Nav pullRight={true}>
                { this.props.loggedIn ? this.showAccount() : null}
                { this.props.loggedIn ? this.showLogout() : null}
                </Nav>
            </Navbar>

    }
}

