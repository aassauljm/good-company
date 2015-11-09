"use strict";
import React from 'react';
import {requestResource, deleteResource} from '../actions';
import { pureRender } from '../utils';
import { connect } from 'react-redux';
import ButtonInput from './forms/buttonInput';
import LookupCompany from  './lookupCompany';
import AuthenticatedComponent from  './authenticated';
import { Link } from 'react-router';
import { PieChart } from 'react-d3/piechart';


class Holding extends React.Component {
    render(){
        return <div className="jumbotron">
            <dl className="dl-horizontal">
                <dt className="col-sm-6">Total Shares</dt>
                <dd className="col-sm-6">{this.props.holding.parcels.reduce((acc, p) => acc + p.amount, 0)}</dd>
                <dt className="col-sm-6">Holders</dt>
                { this.props.holding.holders.map((holder, i) =>
                    <dd className={"col-sm-6" + (i>0 ? "col-sm-offset-6" : '')}>{holder.name} </dd>) }
            </dl>
        </div>
    }
}


@connect((state, ownProps) => state.resources['/company/'+ownProps.params.id +'/get_info' ]|| {data: {}})
@AuthenticatedComponent
export default class Company extends React.Component {

    key(){
        return this.props.params.id
    }

    componentDidMount(){
        this.props.dispatch(requestResource('/company/'+this.key()+'/get_info'));
    }

    componentDidUpdate(){
        this.props.dispatch(requestResource('/company/'+this.key()+'/get_info'));
    }

    groupHoldings(companyState){
        const total = companyState.totalAllocatedShares;
        return companyState.holdings.map(holding => ({
            value: holding.parcels.reduce((acc, p) => acc + p.amount, 0)/total * 100,
            label: holding.holders.map(h => h.name).join(', ')
        }));
    }

    componentWillReceiveProps(nextProps){
        if(nextProps.data ){
            this.setState({holdings: this.groupHoldings(nextProps.data.currentCompanyState)});
        }
    }

    renderData(){
        if(!this.props.data || !this.props.data.currentCompanyState){
            return
                <div className="loading"></div>
        }
        const current = this.props.data.currentCompanyState;
        return <div>
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
                    <dd className="col-sm-9">{current.totalShares}</dd>
                </dl>
                <div className="row">
                <div className="col-sm-6">
                    { current.holdings.map((holding, i) => <Holding key={i} holding={holding} />)}
                </div>
                <div className="col-sm-6 text-center">
                    <PieChart
                          data={this.state.holdings}
                          width={400}
                          height={400}
                          radius={100}
                          innerRadius={20}
                          sectorBorderColor="white"
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

