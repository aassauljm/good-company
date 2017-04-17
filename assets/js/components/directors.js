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
import { asyncConnect } from 'redux-connect';

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
        if(!this.props.companyState || !this.props.companyState.directorList){
            return false;
        }
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


export class DirectorRegisterDocument extends React.Component {
    render(){
        const companyState = this.props.companyState;
        const directors = this.props.companyState.directorList.directors;
        const holders = this.props.companyState.holders;

        return <div className="directors-register-document">

        <h2 className="title">Director Register</h2>
            <table className="heading">
                <tbody><tr>
                <td>
                <h2>{ companyState.companyName }</h2>
                </td>
                <td>
                <h4>NZBN: { companyState.nzbn }</h4>
                <h4>Company Number #{ companyState.companyNumber }</h4>
                </td>
                </tr>
                </tbody>
            </table>
        <div> At as { stringDateToFormattedString(new Date()) }</div>
        <h3>Current Directors</h3>

           <table className="table directors-register">
                <thead>
                <tr><th>Name</th><th>Address</th><th>Appointment Date</th><th>Current Shareholder</th></tr>
                </thead>
                <tbody>
                    { directors.map((director, i) => {
                        return <tr key={i}>
                        <td>{ director.person.name }</td>
                        <td>{ director.person.address }</td>
                        <td>{ stringDateToFormattedString(director.appointment) }</td>

                        <td>{ holders[director.person.personId] ? 'Yes': 'No' }</td>


                        </tr>
                    }) }
                </tbody>
                </table>

        { false && <h3>Historic Directors</h3> }


        </div>
    }
}
@asyncConnect([{
    key: 'shareRegister',
    promise: ({store: {dispatch, getState}, params}) => {
        //return dispatch(requestResource('/company/'+params.id+'/share_register'));
    }
}])
@connect((state, ownProps) => {
    return {data: {}}
})
export class DirectorRegisterDocumentLoader extends React.Component {
    static propTypes = {
        data: PropTypes.object.isRequired
    };

    render() {
        const companyState = ((this.props['/company/'+this.props.params.id +'/get_info'] || {}).data || {}).currentCompanyState;

        if(!companyState){
            return false;
        }
        return <DirectorRegisterDocument companyState={companyState}/>
    }
}


export class DirectorRegister extends React.Component {
    static propTypes = {
        companyState: PropTypes.object,
        companyId: PropTypes.string
    };
    renderControls() {
        return  <div className="button-row">
                <Link className="btn btn-primary" to={`/api/company/render/${this.props.companyId}/director_register`} target='_blank'>Download</Link>
            </div>

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
                    Director Registers
                </div>
            </div>
            <div className='widget-body'>
                    { this.renderControls() }
               <DirectorRegisterDocument {...this.props} />

            </div>
        </div>
        </div>
    }
}