"use strict";
import React from 'react';
import {requestResource, deleteResource} from '../actions';
import { pureRender, numberWithCommas } from '../utils';
import { connect } from 'react-redux';
import ButtonInput from './forms/buttonInput';
import LookupCompany from  './lookupCompany';
import AuthenticatedComponent from  './authenticated';
import { Link } from 'react-router';
import { PieChart } from 'react-d3/piechart';

@pureRender
class Holding extends React.Component {
    render(){
        return <div className="holding">
            <dl className="dl-horizontal">
                <dt className="col-sm-3">Total Shares</dt>
                <dd className="col-sm-9">{numberWithCommas(this.props.holding.parcels.reduce((acc, p) => acc + p.amount, 0))}</dd>
                <dt className="col-sm-3">Holders</dt>
                { this.props.holding.holders.map((holder, i) =>
                    <dd key={i} className={"col-sm-9" + (i>0 ? " col-sm-offset-3" : '')}>{holder.name} <br/>
                    <span className="address">{holder.address}</span></dd>) }
            </dl>
        </div>
    }
}

@pureRender
class Director extends React.Component {
    render(){
        return <div className="director">
            <dl className="dl-horizontal">
                <dt className="col-sm-3">Name</dt>
                <dd className="col-sm-9">{ this.props.director.person.name}</dd>
                <dt className="col-sm-3">Address</dt>
                <dd className="col-sm-9"><span className="address">{ this.props.director.person.address}</span></dd>
                <dt className="col-sm-3">Appointment</dt>
                <dd className="col-sm-9">{ new Date(this.props.director.appointment).toDateString() }</dd>
            </dl>
        </div>
    }
}


@connect((state, ownProps) => {
    if(ownProps.params.generation){
        return state.resources['/company/'+ownProps.params.id +'/history/'+ownProps.params.generation] || {data: {}};
    }
    else{
        return state.resources['/company/'+ownProps.params.id +'/get_info'] || {data: {}};;
    }
})
@AuthenticatedComponent
export default class Company extends React.Component {

    key() {
        return this.props.params.id
    }

    isHistory() {
        return !!this.props.params.generation;
    }

    fetch() {
        if(this.isHistory()){
             this.props.dispatch(requestResource('/company/' + this.key() + '/history/' + this.props.params.generation));
        }
        else{
            this.props.dispatch(requestResource('/company/' + this.key() + '/get_info'));
        }
    }

    componentDidMount() {
        this.fetch();

    }

    componentDidUpdate() {
        this.fetch();
    }

    groupHoldings(companyState){
        const total = companyState.totalAllocatedShares;
        return companyState.holdings.map(holding => ({
            value: holding.parcels.reduce((acc, p) => acc + p.amount, 0)/total * 100,
            label: holding.holders.map(h => h.name).join(', ')
        }));
    }

    renderData() {
        const data = this.props.data || {};
        const current = data.currentCompanyState || data.companyState;
        if(!current){
            return <div className="loading"></div>
        }
        const generation = Number(this.props.params.generation) || 0;
        return <div>
                { current.previousCompanyStateId ?
                    <Link activeClassName="active" className="nav-link" to={"/company/view/"+this.props.params.id+"/history/"+(generation+1)} >Previous Version</Link> : null}

                { generation > 1 ?
                    <Link activeClassName="active" className="nav-link" to={"/company/view/"+this.props.params.id+"/history/"+(generation-1)} >Next Version</Link> : null}

                { generation === 1 ?
                    <Link activeClassName="active" className="nav-link" to={"/company/view/"+this.props.params.id} >Current Version</Link> : null}

                <div className="jumbotron">
                    <h1>{current.companyName}</h1>
                    <h5>#{current.companyNumber}, {current.companyStatus}</h5>
                </div>
                <dl className="dl-horizontal">
                    <dt className="col-sm-3">NZ Business Number</dt>
                    <dd className="col-sm-9">{current.nzbn ||  'Unknown'}</dd>

                    <dt className="col-sm-3">Incorporation Date</dt>
                    <dd className="col-sm-9">{new Date(current.incorporationDate).toDateString()}</dd>

                    <dt className="col-sm-3">Total Shares</dt>
                    <dd className="col-sm-9">{numberWithCommas(current.totalShares)}</dd>

                    <dt className="col-sm-3">AR Filing Month</dt>
                    <dd className="col-sm-9">{current.arFilingMonth}</dd>

                    <dt className="col-sm-3">Entity Type</dt>
                    <dd className="col-sm-9">{current.entityType}</dd>


                </dl>
                <div className="row">
                    <div className="col-md-6">
                        { current.directors.map((director, i) => <Director key={i} director={director} />)}
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6">
                        { current.holdings.map((holding, i) => <Holding key={i} holding={holding} />)}
                    </div>
                    <div className="col-md-6 text-center">

                    <PieChart
                          data={this.groupHoldings(current)}
                          width={400}
                          height={400}
                          radius={100}
                          innerRadius={20}
                          sectorBorderColor="white"
                          showInnerLabels={false}
                          showOuterLabels={false}
                        />
                    </div>
                </div>
            </div>
    }

    render(){
        return <div>
            { this.renderData() }
        </div>
    }
}

