"use strict"
import React from 'react';




export default class GCModal extends React.Component {
    render() {
        return <div className="container">
            <div className="row">
            <div className="widget">
                { this.props.children }
            </div>
            </div>
        </div>
    }
}

class Header extends React.Component {
    render() {
        return  <div className="widget-header">
            { this.props.children }
            </div>
    }
}

class Title extends React.Component {
    render() {
        return  <div className="widget-title">
            { this.props.children }
            </div>
    }
}


class Body extends React.Component {
    render() {
        return  <div className="widget-body">
            { this.props.children }
            </div>
    }
}

class Footer extends React.Component {
    render() {
        return  <div className="widget-footer button-row">
            { this.props.children }
            </div>
    }
}


GCModal.Body = Body;
GCModal.Header = Header;
GCModal.Title = Title;
GCModal.Footer = Footer;
