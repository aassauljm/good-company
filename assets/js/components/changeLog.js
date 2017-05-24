"use strict";
import React from 'react';
import Widget from './widget';
import LawBrowserContainer from './lawBrowserContainer';


export default class ChangeLog extends React.PureComponent {
    render() {
        return <Widget iconClass="fa fa-newspaper-o" title="Recent Changes & New Features">
        <div className="change-log">
            <ul className="bulleted">
            <li>Annual return submission to the Companies Office is now live</li>
            <li>Import changes from the Companies Office</li>
            <li>Configurable third party invitations and access</li>
            </ul>
            </div>
        </Widget>
    }
}