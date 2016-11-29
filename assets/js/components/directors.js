"use strict";
import React, {PropTypes} from 'react';
import { Link } from 'react-router'
import STRINGS from '../strings'
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { pureRender, stringDateToFormattedString } from '../utils';
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
            <dd>{ stringDateToFormattedString(director.appointment) }</dd>
            { director.consentUrl && <dt>Consent Url</dt> }
            { director.consentUrl && <dd><Link to={director.consentUrl } className="external-link" target="_blank">Companies Office</Link></dd> }
            { holders && <dt>Current Shareholder</dt> }
            { holders && <dd>{ holders[director.person.personId] ? 'Yes': 'No'}</dd> }
        </dl>
}


@pureRender
export class Director extends React.Component {
    static propTypes = {
        director: PropTypes.object.isRequired,
        editDirector: PropTypes.func
    };
    render() {
        let className = 'director well ';
        if(this.props.editDirector){
            className += 'actionable ';
        }
        return <div className={className} onClick={this.props.editDirector && (() => this.props.editDirector(this.props.director))}>
                <i className="fa fa-user-circle well-icon" />
            <dl className="dl-horizontal">
                <dt >Name</dt>
                <dd >{ this.props.director.person.name}</dd>
                <dt >Address</dt>
                <dd ><span className="address">{ this.props.director.person.address}</span></dd>
                <dt >Appointment</dt>
                <dd >{ stringDateToFormattedString(this.props.director.appointment) }</dd>
                { this.props.holders && <dt>Current Shareholder</dt> }
                { this.props.holders && <dd>{ this.props.holders[this.props.director.person.personId] ? 'Yes': 'No'}</dd> }
            </dl>
        </div>
    }
}

@pureRender
export class DirectorList extends React.Component {
    static propTypes = {
        directors: PropTypes.array.isRequired,
        editDirector: PropTypes.func,
        holders: PropTypes.object,
    };
    render() {
        const directors = (this.props.directors || []).map((d, i) => <Director director={d} holders={this.props.holders} editDirector={this.props.editDirector} key={i} />);
        return <div className="row">
        <div className="col-md-6">
            { directors.filter((d, i) => i % 2 === 0)}
        </div>
        <div className="col-md-6">
            { directors.filter((d, i) => i % 2 === 1) }
        </div>
        </div>
    }
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
            { directors.length > 1 && <dl className="dl-horizontal">
                <dt>Number of Directors</dt>
                <dd>{ directors.length}</dd>
            </dl> }

            { directors.map((director, i) => <div key={i}>{ renderDirector(director, holders) }</div>) }


            </div>
        </div>
    }

    render() {
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                <span className="fa fa-address-card-o"/> Directors
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

    constructor(props){
        super();
        this.editDirector = ::this.editDirector;
    }

    editDirector(director) {
        this.props.showTransactionView('updateDirector', {
            companyId: this.props.companyId,
            companyState: this.props.companyState,
            director: director,
            afterClose: {
                location: this.props.location.pathname
            }
        });
    }

    render() {
        if(!this.props.companyState || !this.props.companyState.directorList){
            return false;
        }
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
                    <DirectorList directors={directors} holders={holders} editDirector={this.editDirector} />
            </div>
        </div>
        </div>
    }
}