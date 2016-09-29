"use strict";
import React, {PropTypes} from 'react';
import { ShareClassCreate } from './shareClasses'
import { connect } from 'react-redux';
import { push } from 'react-router-redux'
import { requestResource, resetModals } from '../actions';
import { Link } from 'react-router';
import { sortAlerts } from './alerts';

@connect((state, ownProps) => {
    return {alerts: state.resources['/alerts'] || {}};
}, {
    requestData: (key) => requestResource('/alerts', {postProcess: sortAlerts}),
    navigate: (url) => push(url),
})
export class MassSetup extends React.Component {
    render() {
        return <div>
            <div className="row">
                <div className="col-md-12">
                    <div className="widget">
                        <div className="widget-header">
                            <div className="widget-title">
                                Mass Share Register Setup
                            </div>
                        </div>
                        <div className="widget-body">
                            This tool is designed to create and assign similiar share classes to many companies at once.<br/>
                            To begin, fill out the details for the share class below.
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-12">
                    <div className="widget">
                        <div className="widget-header">
                            <div className="widget-title">
                                Share Class
                            </div>
                        </div>
                        <div className="widget-body">
                            <ShareClassCreate submit={() => ({})}/>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-12">
                    <div className="widget">
                        <div className="widget-header">
                            <div className="widget-title">
                                Select Companies
                            </div>
                        </div>
                        <div className="widget-body">

                        </div>
                    </div>
                </div>
            </div>

        </div>
    }
}
