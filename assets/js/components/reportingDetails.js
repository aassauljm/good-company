"use strict";
import React, { PropTypes } from 'react';
import { Link } from 'react-router'
import STRINGS from '../strings'
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { pureRender } from '../utils';
import { companyTransaction, addNotification } from '../actions';
import { ReportingFormConnected, reportingDetailsFormatSubmit, standardFields, defaultCustomFields } from './forms/reportingDetails';
import { replace } from 'react-router-redux'

export class ReportingDetailsWidget extends React.Component {
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

        const data = this.props.companyState, reportingFields = data.reportingFields || [];
        return  <div className="widget-body"  className={bodyClass} onClick={() => this.props.toggle(!this.props.expanded)}>
            <div key="body">

            <dl>
                { standardFields.map((f, i) =>  <div key={i}><dt>{ STRINGS[f] }</dt><dd>{data[f] }</dd></div>) }
                { reportingFields.map((f, i) => f.value && f.label && <div key={i}><dt>{ f.label }</dt><dd>{ f.value}</dd></div>) }
                </dl>
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


@connect(undefined, {
    submit: (type, id, values) => companyTransaction(type, id, values),
    addNotification: (args) => addNotification(args),
    refresh: (location) => replace(location)
})
export default class ReportingDetails extends React.Component {
    static propTypes = {
        companyState: PropTypes.object.isRequired,
        companyId: PropTypes.string.isRequired
    };
    handleSubmit(values) {
        const transactions = reportingDetailsFormatSubmit(values, this.props.companyState);
        if(!transactions[0].actions.length){
            return;
        }
        this.props.submit('compound',
                          this.props.companyId,
                          {transactions: transactions,
                            documents: values.documents})
            .then(() => {
                this.props.addNotification({message: 'Reporting Details Updated'});
                this.props.refresh(this.props.location);
            })
            .catch((err) => {
                this.props.addNotification({message: err.message, error: true});
            })
    }

    render() {
        const data = this.props.companyState, reportingFields = data.reportingFields || defaultCustomFields.map(f => ({
            value: '',
            label: f
        }));

        return <div className="container">
            <div className="">
                <ReportingFormConnected
                    initialValues={{...data, reportingFields : reportingFields}}
                    onSubmit={::this.handleSubmit}
                />
            </div>
        </div>
    }
}