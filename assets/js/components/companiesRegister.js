"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux'
import { asyncConnect } from 'redux-async-connect';
import { requestResource } from '../actions';
import { stringToDate } from '../utils'
import { Link } from 'react-router'


//companyName
//companyNumber
//nzbn
//companyStatus
//entityType

@connect((state, ownProps) => {
    return state.resources[`/company/${ownProps.companyId}/source_data`] || {};
}, {
    requestData: (key) => requestResource(`/company/${key}/source_data`),
    navigate: (url) => push(url)
})
export class CompaniesRegisterWidget extends React.Component {

    fetch() {
        return this.props.requestData(this.props.companyId);
    };
    componentDidMount() {
        this.fetch();
    };

    componentDidUpdate() {
        this.fetch();
    };

    key() {
        return this.props.companyId;
    }

    renderBody() {
        if(this.props._status  === 'fetching'){
            return <div className="loading"/>
        }
        const data = (this.props.data || {}).data || {};
        return <div className="row">
            <div className="col-xs-6">
                    <div><strong>Name</strong> {data.companyName}</div>
                    <div><strong>Company  Number</strong> {data.companyNumber ||  'Unknown'}</div>
                    <div><strong>NZ Business Number</strong> {data.nzbn ||  'Unknown'}</div>
                    <div><strong>Incorporation Date</strong> {stringToDate(data.incorporationDate)}</div>
                    </div>
            <div className="col-xs-6">
                    <div><strong>AR Filing Month</strong> {data.arFilingMonth ||  'Unknown'}</div>
                    <div><strong>Entity Type</strong> {data.entityType ||  'Unknown' }</div>
                    <div><strong>Status</strong> {data.companyStatus ||  'Unknown' }</div>
            </div>
        </div>
    }

    render() {
        const data = (this.props.data || {}).data || {};
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    Companies Register
                </div>
                <div className="widget-control">
                <Link to={`/company/${this.key()}/source_data`} >View All</Link>
                </div>
            </div>

            <div className="widget-body">
               { this.renderBody() }
            </div>
        </div>
    }
}

