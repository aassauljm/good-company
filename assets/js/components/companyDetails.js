"use strict";
import React, {PropTypes} from 'react';
import { showTransactionView } from '../actions';
import { pureRender, numberWithCommas, stringDateToFormattedString } from '../utils';
import ButtonInput from './forms/buttonInput';
import { Link } from 'react-router';
import STRINGS from '../strings';
import RadialGraph from './graphs/radial';


function companyStateToTree(state){
    return {
        name: state.companyName,
        children: [
            {
                name: 'Directors',
                children: state.directorList.directors.map(d => ({
                    name: d.person.name
                }))
            },
            {
                name: 'Shareholdings',
                children: state.holdingList.holdings.map(h => ({
                    name: h.name,
                    children: h.holders.map(h => ({
                                name: h.person.name
                            }))
                }))
            }
        ]
    }
}

@pureRender
export class DetailsPanel extends React.Component {
    static propTypes = {
        companyState: PropTypes.object.isRequired
    };
    render(){

        const current = this.props.companyState;
        return <div className="panel panel-warning" >
            <div className="panel-heading">
            <h3 className="panel-title">Company Details</h3>
            </div>
            <div className="panel-body">
            <div className="row">
            <div className="col-xs-6">
                    <div><strong>Name</strong> {current.companyName}</div>
                    <div><strong>NZ Business Number</strong> {current.nzbn ||  'Unknown'}</div>
                    <div><strong>Incorporation Date</strong> {stringDateToFormattedString(current.incorporationDate)}</div>
                    </div>
            <div className="col-xs-6">
                    <div><strong>AR Filing Month</strong> {current.arFilingMonth ||  'Unknown'}</div>
                    <div><strong>Entity Type</strong> {current.entityType ||  'Unknown' }</div>
                    </div>
                </div>
            </div>
        </div>
    }
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
            <dl className="dl-horizontal">
                <dt >Name</dt>
                <dd >{ this.props.director.person.name}</dd>
                <dt >Address</dt>
                <dd ><span className="address">{ this.props.director.person.address}</span></dd>
                <dt >Appointment</dt>
                <dd >{ stringDateToFormattedString(this.props.director.appointment) }</dd>
            </dl>
        </div>
    }
}

@pureRender
class Directors extends React.Component {
    static propTypes = {
        directors: PropTypes.array.isRequired,
        editDirector: PropTypes.func
    };
    render() {
        const directors = (this.props.directors || []).map((d, i) => <Director director={d} editDirector={this.props.editDirector} key={i} />);
        return <div className="row">
        <div className="text-center"><h3>Directors</h3></div>
        <div className="col-md-6">
            { directors.slice(0, directors.length/2)}
        </div>
        <div className="col-md-6">
            { directors.slice(directors.length/2) }
        </div>
        </div>
    }
}


@pureRender
export class CompanyDetails extends React.Component {
    static propTypes = {
        companyState: PropTypes.object,
        showTransactionView: PropTypes.func
    };

    constructor(props) {
        super(props);
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
        const current = this.props.companyState;
        return <div className="container"><div className="well">
                <dl className="dl-horizontal">
                    <dt >NZ Business Number</dt>
                    <dd >{current.nzbn ||  'Unknown'}</dd>

                    <dt >Incorporation Date</dt>
                    <dd >{stringDateToFormattedString(current.incorporationDate)}</dd>

                    <dt >Total Shares</dt>
                    <dd >{numberWithCommas(current.totalShares)}</dd>

                    <dt >AR Filing Month</dt>
                    <dd >{current.arFilingMonth}</dd>

                    <dt >Entity Type</dt>
                    <dd >{current.entityType}</dd>


                    { current.registeredCompanyAddress && <dt>Company Address</dt> }
                    { current.registeredCompanyAddress && <dd>{current.registeredCompanyAddress }</dd> }

                    { current.addressForShareRegister && <dt>Address for Share Register</dt> }
                    { current.addressForShareRegister && <dd>{current.addressForShareRegister }</dd> }

                    { current.addressForService && <dt>Address For Service</dt> }
                    { current.addressForService && <dd>{current.addressForService}</dd> }
                </dl>
            </div>
            <Directors directors={current.directorList.directors} editDirector={this.editDirector}/>
            <div>
                <RadialGraph data={companyStateToTree(current)} />
            </div>

            </div>
    }
}




