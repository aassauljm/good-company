"use strict"
import React from 'react'
import pureRender from 'pure-render-decorator';
import Router from 'react-router'
import { Navbar, Nav, NavItem,  DropdownButton, MenuItem} from 'react-bootstrap';
import { Link } from 'react-router'

@pureRender
export default class Main extends React.Component {
    showMenus(){

    }
    render() {
        return  <Navbar brand='Title' className="navbar-dark bg-inverse">
                <Nav pullRight={true}>
                {this.props.showMenus() }
                { this.props.loggedIn ?<li className="nav-item"><a className="nav-link" href="logout">Log out</a></li> : null}
                </Nav>
            </Navbar>

    }
}

