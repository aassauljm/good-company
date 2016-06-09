"use strict";
import React, {PropTypes} from 'react';
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

function renderDirector(director, holders){
   return <dl className="dl-horizontal">
            <dt>Name</dt>
            <dd>{ director.person.name }</dd>
            <dt>Address</dt>
            <dd><span className="address">{ director.person.address } </span></dd>
            <dt>Appointment Date</dt>
            <dd>{ stringToDate(director.appointment) }</dd>
            { director.consentUrl && <dt>Consent Url</dt> }
            { director.consentUrl && <dd><Link to={director.consentUrl } className="external-link" target="_blank">Companies Office</Link></dd> }
            { holders && <dt>Current Shareholder</dt> }
            { holders && <dd>{ holders[director.person.personId] ? 'Yes': 'No'}</dd> }
        </dl>
}


@pureRender
export class DirectorsWidget extends React.Component {
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
        const directors = this.props.companyState.directorList.directors;
        const holders = this.props.companyState.holders;
        return  <div className={bodyClass} onClick={() => this.props.toggle(!this.props.expanded)}>
            <div  key="body">
            <dl className="dl-horizontal">
                <dt>{ directors.length}</dt>
                <dd>Current {directors.length === 1 ? 'Director' : 'Directors'}</dd>
            </dl>

            { directors.map((director, i) => <div key={i}>{ renderDirector(director, holders) }</div>) }


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


export default class Directors extends React.Component {
    static propTypes = {
        companyState: PropTypes.object,
        companyId: PropTypes.string
    };

    editDirector(director) {
        this.props.showModal('updateDirector', {
            companyId: this.props.companyId,
            companyState: this.props.companyState,
            director: director,
            afterClose: {
                location: this.props.location.pathname
            }
        });
    }

    render() {
        const directors = this.props.companyState.directorList.directors;
        const holders = this.props.companyState.holders;
        return <div className="container">
            <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    Directors
                </div>
            </div>
            <div className='widget-body'>
                <h5 className="text-center">Current Directors</h5>
                <div className="row">
                    { directors.map((director, i) => <div key={i} className="col-md-6">
                        <div className="outline actionable" onClick={() => this.editDirector(director)}>
                            { renderDirector(director, holders) }
                        </div>
                    </div>) }
                </div>

                { /* <h5 className="text-center">Former Directors</h5>
                <div className="row">
                    TODO
                </div> */ }
            </div>
        </div>
        </div>
    }
}