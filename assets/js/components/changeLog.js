"use strict";
import React from 'react';
import Widget from './widget';
import LawBrowserContainer from './lawBrowserContainer';


const changes = [
    <li key={7}>Annual Confirmation for external users</li>,
    <li key={6}>Improved signatures for templates, including optional witnesses</li>,
    <li key={5}>New board resolutions for changing company addresses</li>,
    <li key={4}>NZ Post address look ups, for users with Companies Office integration</li>,
    <li key={3}>Aggregated notifications and improved workflows</li>,
    <li key={2}>Annual return submission to the Companies Office is now live</li>,
    <li key={1}>Import changes from the Companies Office</li>,
    <li key={0}>Configurable third party invitations and access</li>
]




export class ChangeLogFull extends React.PureComponent {
    render() {
        return <LawBrowserContainer>
        <Widget iconClass="fa fa-newspaper-o" title="Recent Changes & New Features">
        <div className="change-log">
            <ul className="bulleted">
                { changes }
            </ul>
            </div>
        </Widget>
        </LawBrowserContainer>
    }
}


export default class ChangeLog extends React.PureComponent {
    render() {
        return <Widget iconClass="fa fa-newspaper-o" title="Recent Changes & New Features" link={'/recent_changes'}>
        <div className="change-log">
            <ul className="bulleted">
                { changes.slice(0,4) }
            </ul>
            </div>
        </Widget>
    }
}