"use strict";
import React, {PropTypes} from 'react';
import {requestResource, changeCompanyTab} from '../actions';
import { pureRender, numberWithCommas } from '../utils';
import { connect } from 'react-redux';
import ButtonInput from './forms/buttonInput';
import LookupCompany from  './lookupCompany';
import AuthenticatedComponent from  './authenticated';
import { Link } from 'react-router';
import { PieChart } from 'react-d3/piechart';
import Tabs from 'react-bootstrap/lib/Tabs';
import Tab from 'react-bootstrap/lib/Tab';


@pureRender
class Holding extends React.Component {
    static propTypes = {
        holding: PropTypes.object.isRequired,
    };
    render(){
        const total = this.props.holding.parcels.reduce((acc, p) => acc + p.amount, 0),
            percentage = (total/this.props.total*100).toFixed(2) + '%';
        return <div className="holding well">
            <dl className="dl-horizontal">
                <dt >Total Shares</dt>
                <dd >{numberWithCommas(total) + ' ' + percentage}</dd>
                <dt >Holders</dt>
                { this.props.holding.holders.map((holder, i) =>
                    <dd key={i} >{holder.name} <br/>
                    <span className="address">{holder.address}</span></dd>) }
            </dl>
        </div>
    }
}

@pureRender
class Director extends React.Component {
    static propTypes = {
        director: PropTypes.object.isRequired,
    };
    render() {
        return <div className="director well">
            <dl className="dl-horizontal">
                <dt >Name</dt>
                <dd >{ this.props.director.person.name}</dd>
                <dt >Address</dt>
                <dd ><span className="address">{ this.props.director.person.address}</span></dd>
                <dt >Appointment</dt>
                <dd >{ new Date(this.props.director.appointment).toDateString() }</dd>
            </dl>
        </div>
    }
}

@pureRender
class Directors extends React.Component {
    static propTypes = {
        directors: PropTypes.array.isRequired,
    };
    render() {
        return <div className="row">
            <div className="col-md-6">
                { this.props.directors.map((director, i) => <Director key={i} director={director} />)}
            </div>
        </div>
    }
}

@pureRender
class Holdings extends React.Component {
    static propTypes = {
        holdings: PropTypes.array.isRequired,
    };

    groupHoldings() {
        const total = this.props.totalAllocatedShares;
        return this.props.holdings.map(holding => ({
            value: holding.parcels.reduce((acc, p) => acc + p.amount, 0)/total * 100,
            label: holding.holders.map(h => h.name).join(', ')
        }));
    }

    render() {
        return <div className="row">
            <div className="col-md-6">
                { this.props.holdings.map((holding, i) => <Holding key={i} holding={holding} total={this.props.totalShares}/>)}
            </div>
            <div className="col-md-6 text-center">

            <PieChart
                  data={this.groupHoldings()}
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
    }
}

@connect((state, ownProps) => {
    return {data: {}, ...state.resources['/company/'+ownProps.companyId +'/transactions']}
})
class TransactionHistory extends React.Component {
    static propTypes = {
        data: PropTypes.object.isRequired,
    };

    fetch() {
        return this.props.dispatch(requestResource('/company/'+this.props.companyId+'/transactions'))
    }

    componentDidMount() {
        this.fetch();
    }

    componentDidUpdate() {
        this.fetch();
    }

    rows(transactions) {
        const rows = [];
        transactions.map((t, i) => {
            const rowSpan = (t.transaction.subTransactions ? t.transaction.subTransactions.length : 0) + 1;
            rows.push(<tr key={i}>
                <td rowSpan={rowSpan}>{ t.transaction.transactionId }</td>
                <td rowSpan={rowSpan}>{ new Date(t.transaction.effectiveDate).toDateString() }</td>
                <td rowSpan={rowSpan}>{ t.transaction.type }</td>
            </tr>);
            (t.transaction.subTransactions || []).map((t, j) => {
                rows.push(<tr key={i+'-'+j} ><td>{t.type}</td></tr>)
            });
        });
        return rows;
    }

    render() {
        const transactions = (this.props.data || {}).transactions;
        if(!transactions){
            return <div className="loading"></div>
        }
        return <div>
                <table className="table table-hover">
                <thead><tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Subtype</th>
                </tr></thead>
                <tbody>
                    {this.rows(transactions) }
                </tbody>
                </table>
            </div>
    }
}



@connect((state, ownProps) => {
    let comp;
    if(ownProps.params.generation){
        comp = state.resources['/company/'+ownProps.params.id +'/history/'+ownProps.params.generation];

    }
    else{
        comp = state.resources['/company/'+ownProps.params.id +'/get_info'];
    }
    return {data: {}, companyPage: state.companyPage, ...comp};
})
@AuthenticatedComponent
export default class Company extends React.Component {
    static propTypes = {
        companyPage: PropTypes.object.isRequired,
        data: PropTypes.object.isRequired
    };
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

    handleTabSelect(key) {
        this.props.dispatch(changeCompanyTab(key));
    }

    renderData() {
        const data = this.props.data || {};
        const current = data.currentCompanyState || data.companyState;
        if(!current){
            return <div className="loading"></div>
        }
        const generation = Number(this.props.params.generation) || 0;
        return <div>
                <ul className="pager">
                { current.previousCompanyStateId ?
                    <li className="previous"><Link activeClassName="active" className="nav-link" to={"/company/view/"+this.props.params.id+"/history/"+(generation+1)} >← Previous Version</Link></li> : null}

                { generation > 1 ?
                    <li className="next"><Link activeClassName="active" className="nav-link" to={"/company/view/"+this.props.params.id+"/history/"+(generation-1)} >Next Version →</Link></li> : null}

                { generation === 1 ?
                    <li className="next"><Link activeClassName="active" className="nav-link" to={"/company/view/"+this.props.params.id} >Current Version</Link></li> : null}

              </ul>
                <div className="jumbotron">
                { generation ? <h4>As at {new Date(current.transaction.effectiveDate).toDateString() }</h4> : null}
                    <h1>{current.companyName}</h1>
                    <h5>#{current.companyNumber}, {current.companyStatus}</h5>
                </div>
                <div className="well">
                <dl className="dl-horizontal">
                    <dt >NZ Business Number</dt>
                    <dd >{current.nzbn ||  'Unknown'}</dd>

                    <dt >Incorporation Date</dt>
                    <dd >{new Date(current.incorporationDate).toDateString()}</dd>

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
                <Tabs activeKey={this.props.companyPage.tabIndex } onSelect={::this.handleTabSelect}>
                    <Tab eventKey={0} title="Shareholdings"><Holdings holdings={current.holdings}
                        totalShares={current.totalShares}
                        totalAllocatedShares={current.totalAllocatedShares}/></Tab>
                    <Tab eventKey={1} title="Directors"><Directors directors={current.directors}/></Tab>
                    <Tab eventKey={2} title="Documents"><Directors directors={current.directors}/></Tab>
                    <Tab eventKey={3} title="History"><TransactionHistory companyId={this.key()} /></Tab>
                </Tabs>
            </div>
    }

    render(){
        return <div>
            { this.renderData() }
        </div>
    }
}

