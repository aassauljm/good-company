"use strict"
import React from 'react'
import pureRender from 'pure-render-decorator';
import Router from 'react-router'
import { Navbar, Nav, NavItem,  DropdownButton, MenuItem} from 'react-bootstrap';
import { Link } from 'react-router';
import Actions from '../actions';


@pureRender
export default class Main extends React.Component {
    componentDidMount(){
        if(!this.props.userInfo){
            Actions.userInfo();
        }
    }
    showMenus(){

    }
    showAccount(){
         return  this.props.userInfo ? <li className="nav-item"><a className="nav-link" href="logout">{this.props.userInfo.username}</a></li> : null;
    }
    showLogout(){
        return  this.props.loggedIn ? <li className="nav-item"><a className="nav-link" href="logout">Log out</a></li> : null;
    }
    render() {
        return  <Navbar brand='Title' className="navbar-dark bg-inverse">
                <Nav pullRight={true}>
                {this.showMenus() }
                { this.props.loggedIn ? this.showAccount() : null}
                { this.props.loggedIn ? this.showLogout() : null}
                </Nav>
            </Navbar>

    }
}

