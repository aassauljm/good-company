"use strict"
import React from 'react'
import pureRender from 'pure-render-decorator';
import Router from 'react-router'
import { Navbar, Nav, NavItem, DropdownButton, MenuItem} from 'react-bootstrap';


@pureRender
export default class Main extends React.Component {
    render() {
        return <div>
            <Navbar brand='Title'>
                <Nav>
                  <NavItem eventKey={1} href='/users'>Option</NavItem>
                </Nav>
              </Navbar>
        </div>;
    }
}

