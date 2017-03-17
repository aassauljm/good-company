"use strict";
import React, { PropTypes } from 'react';
import { Link } from 'react-router'
import STRINGS from '../strings'
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { pureRender } from '../utils';
import { companyTransaction, addNotification, showTransactionView } from '../actions';
import { ContactFormConnected, contactDetailsFormatSubmit, immutableFields, defaultCustomFields } from './forms/contactDetails';
import { replace, push } from 'react-router-redux'
import LawBrowserContainer from './lawBrowserContainer'
import LawBrowserLink from './lawBrowserLink'
import TransactionView from './forms/transactionView';
import { ForeignPermissionsHOC } from '../hoc/resources';

const RenderPermissionType = (props) => {
    if(props.perm.permissions.indexOf('update') >= 0){
        return <strong>Administration Access</strong>
    }
     if(props.perm.permissions.indexOf('read') >= 0){
        return <strong>View Only Access</strong>
     }
     return <strong>No Access</strong>
}

@ForeignPermissionsHOC()
export class AccessListWidget extends React.Component {
    static propTypes = {
        companyState: PropTypes.object.isRequired,
        companyId: PropTypes.string.isRequired,
        toggle: PropTypes.func.isRequired,
        expanded: PropTypes.bool
    };

    key() {
        return this.props.companyId;
    }

    renderAccessList() {
        console.log(this.props);
        if(this.props.foreignPermissions && this.props.foreignPermissions.data){
            return this.props.foreignPermissions.data.map((perm, i) => {
                return <div>{ perm.name } <RenderPermissionType perm={perm} /></div>
            })
        }
    }

    renderBody() {
        let bodyClass = "widget-body expandable ";
        if(this.props.expanded){
            bodyClass += "expanded ";
        }

        const data = this.props.companyState;
        return  <div className="widget-body"  className={bodyClass} onClick={() => this.props.toggle(!this.props.expanded)}>
            <div key="body" >
            <dl className="dl-horizontal">
            <dt>{ STRINGS.accessControl.owner }</dt>
            <dd>{ this.props.owner && this.props.owner.username }</dd>

            <dt>{ STRINGS.accessControl.organisation }</dt>
            <dd>{ this.renderAccessList() }</dd>

            </dl>
            </div>
        </div>
    }

    render() {
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    <span className="fa fa-key"/> Access List
                </div>
                <div className="widget-control">
                 <Link to={`/company/view/${this.key()}/contact`} >View All</Link>
                </div>
            </div>
            { this.renderBody() }
        </div>
    }
}

