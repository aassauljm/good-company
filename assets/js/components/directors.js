"use strict";
import React from 'react';
import { Link } from 'react-router'
import STRINGS from '../strings'
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { pureRender, stringToDate } from '../utils';
import { companyTransaction, addNotification } from '../actions';
import { replace } from 'react-router-redux'

/*
  Interests? (yes/no – if yes, link to Interests Register),
  Contact (email, phone).
  Link to view historic information for directors.
  Link to update director information.
*/

@pureRender
export class DirectorsWidget extends React.Component {
    key() {
        return this.props.companyId;
    }
    renderBody() {
        let bodyClass = "widget-body expandable ";
        if(this.props.expanded){
            bodyClass += "expanded ";
        }
        const directors = this.props.companyState.directorList.directors;
        const holders = this.props.companyState.holders;
        return  <div className="widget-body"  className={bodyClass} onClick={() => this.props.toggle(!this.props.expanded)}>
            <div  key="body">
            <dl className="dl-horizontal">
                <dt>{ directors.length}</dt>
                <dd>Current {directors.length === 1 ? 'Director' : 'Directors'}</dd>
            </dl>

            { directors.map((director, i) => {
                return <dl key={i} className="dl-horizontal">
                    <dt>Name</dt>
                    <dd>{ director.person.name }</dd>
                    <dt>Address</dt>
                    <dd><span className="address">{ director.person.address } </span></dd>
                    <dt>Appointment Date</dt>
                    <dd>{ stringToDate(director.appointment) }</dd>
                    { director.consentUrl && <dt>Consent Url</dt> }
                    { director.consentUrl && <dd><Link to={director.consentUrl } className="external-link" target="blank">Companies Office</Link></dd> }

                    <dt>Current Shareholder</dt>
                    <dd>{ holders[director.person.personId] ? 'Yes': 'No'}</dd>

                </dl>
            })}


            </div>
        </div>
    }

    render() {
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    Directors
                </div>
                <div className="widget-control">
                 <Link to={`/company/view/${this.key()}/directors`} >View All</Link>
                </div>
            </div>
            { this.renderBody() }
        </div>
    }
}
