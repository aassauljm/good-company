"use strict"
import React from 'react';
import LawBrowserContainer from '../lawBrowserContainer'

export default class GCTransactionView extends React.PureComponent {
    render() {
        if(this.props.lawLinks){
            return <LawBrowserContainer lawLinks={this.props.lawLinks}>
                <div className={(this.props.className || '') + " widget"}>
                    { this.props.children }
                </div>
            </LawBrowserContainer>
        }

        return <LawBrowserContainer>
            <div className="widget">
                { this.props.children }
            </div>
            </LawBrowserContainer>
    }
}

class Header extends React.PureComponent {
    render() {
        return  <div className="widget-header-wrap">
            <div className="widget-header">
            { this.props.children }
            </div>
            </div>
    }
}

class Title extends React.PureComponent {
    render() {
        return  <div className="widget-title">
            { this.props.children }
            </div>
    }
}


class Body extends React.PureComponent {
    render() {
        return  <div className="widget-body-wrap">
            <div className="widget-body">
            { this.props.children }
            </div>
            </div>
    }
}

class Footer extends React.PureComponent {
    render() {
        return  <div className="widget-footer button-row">
            { this.props.children }
            </div>
    }
}


GCTransactionView.Body = Body;
GCTransactionView.Header = Header;
GCTransactionView.Title = Title;
GCTransactionView.Footer = Footer;
