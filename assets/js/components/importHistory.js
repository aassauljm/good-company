"use strict";
import React, { PropTypes } from 'react';
import { requestResource, deleteResource } from '../actions';
import { pureRender, stringToDate } from '../utils';
import { connect } from 'react-redux';
import ButtonInput from './forms/buttonInput';
import { Link } from 'react-router'
import STRINGS from '../strings'
import { asyncConnect } from 'redux-connect';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';


@connect((state, ownProps) => {
    return state.resources[`/company/${ownProps.companyId}/pending_history`] || {};
}, {
    requestData: (key) => requestResource(`/company/${key}/pending_history`),
    navigate: (url) => push(url)
})


export default class ImportHistory extends React.Component {

    fetch() {
        return this.props.requestData(this.props.companyId);
    };

    componentDidMount() {
        this.fetch();
    };

    componentDidUpdate() {
        this.fetch();
    };

    renderBody() {
        return <div><p>There are total of { this.props.data.actions.length } historic documents from the Companies Office to import.</p>
        <p>Good Company can usually understand the transactions in these documents, but may need your input to resolve any ambiguities.  </p>
        <p>If you are unable to provide the requested details, don't worry - you can come back at any point and continue where you left off. </p>
        <div className="button-row">
            <ButtonInput bsStyle="primary">Start Importing Company History</ButtonInput>
        </div>

        </div>
    }

    render() {
        return <div className="container">
            <div className="row">
            <div className="widget">
                <div className="widget-header">
                    <div className="widget-title">
                        Import Company History
                    </div>
                </div>
                <div className="widget-body">
                    { this.props._status === 'complete'  && this.renderBody() }
                    { this.props._status === 'fetching'  && <div className="loading"> <Glyphicon glyph="refresh" className="spin"/></div> }
                </div>
            </div>
            </div>
        </div>
    }
}
