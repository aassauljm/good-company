"use strict";
import React, {PropTypes} from 'react';
import { Link } from 'react-router'
import STRINGS from '../strings'
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { pureRender } from '../utils';
import { companyTransaction, addNotification } from '../actions';
import { replace } from 'react-router-redux'

export class ReportingWidget extends React.Component {
    static propTypes = {
        companyState: PropTypes.object.isRequired,
        companyId: PropTypes.string.isRequired,
        toggle: PropTypes.func.isRequired,
        expanded: PropTypes.bool
    };

    key() {
        return this.props.companyId;
    }
    renderBody() {
        let bodyClass = "widget-body expandable ";
        if(this.props.expanded){
            bodyClass += "expanded ";
        }

        return  <div className={bodyClass} onClick={() => this.props.toggle(!this.props.expanded)}>
            <div className="row" key="body">
                <div className="col-xs-12">
                </div>
            </div>
        </div>
    }

    render() {
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    Reporting
                </div>
                <div className="widget-control">
                 <Link to={`/company/view/${this.key()}/reporting`} >View All</Link>
                </div>
            </div>
            { this.renderBody() }
        </div>
    }
}
