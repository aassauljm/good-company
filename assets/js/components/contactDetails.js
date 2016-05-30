"use strict";
import React from 'react';
import { Link } from 'react-router'
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import STRINGS from '../strings'

/*
Address for Inspection of Records,
Head Office,
Branch Offices,
Website URL,
Email,
Phone,
Fax,
Lawyers,
Accountants,
Bank,
Custom Fields (to be added by user)
*/

const defaultFields = ['Address for Inspection of Records', 'Head Office', 'Branch Offices', 'Website URL', 'Email', 'Phone', 'Fax', 'Lawyers', 'Accountants', 'Bank'];

const standardFields = ['registeredCompanyAddress', 'addressForService']

export class ContactDetailsWidget extends React.Component {
    key() {
        return this.props.companyId;
    }
    renderBody() {
        let bodyClass = "widget-body expandable ";
        if(this.props.expanded){
            bodyClass += "expanded ";
        }

        const data = this.props.companyState, userFields = data.userFields || {};
        return  <div className="widget-body"  className={bodyClass} onClick={() => this.props.toggle(!this.props.expanded)}>
            <div className="row" key="body">
                <div className="col-xs-12">
                    { standardFields.map((f, i) =>  <div key={i}><strong>{ STRINGS[f] } </strong> {data[f] }</div>) }
                    { defaultFields.map((f, i) => userFields[f] && <div key={i}><strong>{ f } </strong> {userFields[f] }</div>) }
                </div>
            </div>
        </div>
    }

    render() {
        const data = (this.props.data || {}).data || {};
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    Contact
                </div>
                <div className="widget-control">
                 <Link to={`/company/${this.key()}/contact`} >View All</Link>
                </div>
            </div>
            { this.renderBody() }
        </div>
    }
}

