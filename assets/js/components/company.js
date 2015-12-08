"use strict";
import React, {PropTypes} from 'react';
import {requestResource, changeCompanyTab} from '../actions';
import { pureRender, numberWithCommas } from '../utils';
import { connect } from 'react-redux';
import ButtonInput from './forms/buttonInput';
import LookupCompany from  './lookupCompany';
import AuthenticatedComponent from  './authenticated';
import { Link } from 'react-router';
import PieChart  from 'react-d3-components/lib/PieChart';
import BarChart  from 'react-d3-components/lib/BarChart';
import Tabs from 'react-bootstrap/lib/Tabs';
import Tab from 'react-bootstrap/lib/Tab';
import Panel from './panel';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { pushState } from 'redux-router';
import moment from 'moment';
import STRINGS from '../strings';

class NotFound extends React.Component {
    static propTypes = {
        descriptor: PropTypes.string.isRequired
    };
    render() {
        return <div className="container"><h4 className="text-center">{this.props.descriptor} Not Found</h4></div>
    }
};
class LawBrowserLink extends React.Component {
    static propTypes = {
        title: PropTypes.string,
        location: PropTypes.string
    };
    formatLink() {
        return `https://browser.catalex.nz/open_article/query?doc_type=instrument&title=${this.props.title}&find=location&location=${this.props.location}`
    }
    render() {
        return <a href={this.formatLink()} target="_blank">{ this.props.children }</a>
    }
};



@pureRender
class ShareholdingsPanel extends React.Component {

    static propTypes = {
        holdings: PropTypes.array.isRequired,
        totalShares: PropTypes.number.isRequired,
        totalAllocatedShares: PropTypes.number.isRequired
    };

    groupHoldings() {
        const total = this.props.totalAllocatedShares;
        return {values: this.props.holdings.map(holding => ({
            y: holding.parcels.reduce((acc, p) => acc + p.amount, 0)/total * 100,
            x: holding.name
        }))};
    };

    countClasses() {
       const length = new Set(this.props.holdings.reduce((acc, holding) => {
            return [...acc, ...holding.parcels.map(p => p.shareClass)]
       }, [])).size;
       return length;
    };

    countHolders() {
       const length = new Set(this.props.holdings.reduce((acc, holding) => {
            return [...acc, ...holding.holders.map(p => p.personId)]
       }, [])).size;
       return length;
    };

    render(){
        const classCount = this.countClasses();
        const holderCount = this.countHolders();
        return <div className="panel panel-info actionable">
            <div className="panel-heading">
            <h3 className="panel-title">Current Shareholdings</h3>
            </div>
            <div className="panel-body">
                <div className="row">
                    <div className="col-xs-6">
                    <div><strong>{numberWithCommas(this.props.totalShares)}</strong> Total Shares</div>
                    <div><strong>{this.props.holdings.length}</strong> Holdings</div>
                    <div><strong>{holderCount}</strong> Shareholder{holderCount !== 1 && 's'}</div>
                    <div><strong>{classCount}</strong> Share Class{classCount !== 1 && 'es'}</div>
                    </div>
                    <div className="col-xs-6 text-center">
                       <div className="hide-graph-labels">
                         <PieChart
                          data={this.groupHoldings()}
                          width={100}
                          height={100}
                          innerRadius={0.0001}
                          outerRadius={50}
                          showInnerLabels={false}
                          showOuterLabels={false} />
                          </div>
                    </div>
                </div>
            </div>
        </div>
    }
}



@pureRender
class TransactionsPanel extends React.Component {
    static propTypes = {
        transactions: PropTypes.array.isRequired
    };
    groupTransactionDates(){
        return [{label: '10', values: [{x: 'SomethingA', y: 2}]}]
    }
    render(){
        const data = this.groupTransactionDates(this.props.transactions)

        return <div className="panel panel-success" >
            <div className="panel-heading">
            <h3 className="panel-title">Transactions</h3>
            </div>
            <div className="panel-body">
            <div><strong>Last Transaction </strong>
            {this.props.transactions[0].type+' ' }
             {new Date(this.props.transactions[0].effectiveDate).toDateString()}</div>
            <BarChart
                groupedBars
                data={this.groupTransactionDates()}
                width={300}
                height={100}
                yAxis={{tickArguments: [], tickValues: [], label: ""}}
                margin={{top: 10, bottom: 50, left: 50, right: 10}}/>
            </div>
        </div>
    }
}

@pureRender
class DetailsPanel extends React.Component {
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
                    <div><strong>Incorporation Date</strong> {new Date(current.incorporationDate).toDateString()}</div>
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
class ShareRegisterPanel extends React.Component {
    static propTypes = {
    };
    render(){

        return <div className="panel panel-danger" >
            <div className="panel-heading">
            <h3 className="panel-title">Share Register</h3>
            </div>
            <div className="panel-body">

            </div>
        </div>
    }
}

@pureRender
class Holding extends React.Component {
    static propTypes = {
        holding: PropTypes.object.isRequired,
        total: PropTypes.number.isRequired
    };
    render(){
        const total = this.props.holding.parcels.reduce((acc, p) => acc + p.amount, 0),
            percentage = (total/this.props.total*100).toFixed(2) + '%';

        return <div className="holding well">
            <div className="row">
                <div className="col-xs-10">
                <dl className="dl-horizontal">
                    <dt >Name</dt>
                    <dd >{ this.props.holding.name }</dd>
                    <dt >Total Shares</dt>
                    <dd >{numberWithCommas(total) + ' ' + percentage}</dd>
                    <dt >Holders</dt>
                    { this.props.holding.holders.map((holder, i) =>
                        <dd key={i} >{holder.name} <br/>
                        <span className="address">{holder.address}</span></dd>) }
                </dl>
                </div>
                <div className="col-xs-2">
                   <div className="hide-graph-labels">
                 <PieChart
                          data={{values: [{y: total, x: 'this'}, {y: this.props.total-total, x: 'other'}]}}
                          innerRadius={0.001}
                          outerRadius={30}
                          width={60}
                          height={60} />
                    </div>
                    </div>
            </div>
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
        <div className="text-center"><h3>Directors</h3></div>
        { this.props.directors.map((director, i) => <div className="col-md-6"><Director key={i} director={director} /></div>)}

        </div>
    }
}

@pureRender
export class Shareholdings extends React.Component {
    static propTypes = {
        companyState: PropTypes.object,
    };

    groupHoldings() {
        const total = this.props.companyState.totalAllocatedShares;
        return {values: this.props.companyState.holdings.map(holding => ({
            y: holding.parcels.reduce((acc, p) => acc + p.amount, 0)/total * 100,
            x: holding.name
        }))};
    };
    render() {
        return <div className="container"><div className="row">
            <div className="col-md-6">
                { this.props.companyState.holdings.map((holding, i) => <Holding key={i} holding={holding} total={this.props.companyState.totalShares}/>)}
            </div>
            <div className="col-md-6 text-center">
                <div className="hide-graph-labels">
               <PieChart
                  data={this.groupHoldings()}
                  width={100}
                  height={100}
                  innerRadius={0.0001}
                  outerRadius={50}
                  showInnerLabels={false}
                  showOuterLabels={false} />
                  </div>
            </div>
        </div>
        </div>
    }
}

@pureRender
export class CompanyDetails extends React.Component {
    static propTypes = {
        companyState: PropTypes.object,
    };

    render() {
        const current = this.props.companyState;
        return <div className="container"><div className="well">
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
            <Directors directors={current.directors}/>
            </div>
    }
}

function renderShareClass(shareClass){
    return shareClass || 'Ordinary'
}


function renderIssue(action){
    const date = new Date(action.effectiveDate).toDateString();
    return `${action.data.amount} ${renderShareClass(action.data.shareClass)} on ${date}`
}

function renderTransferTo(action){
    const date = new Date(action.effectiveDate).toDateString();
    return  `${action.data.amount} ${renderShareClass(action.data.shareClass)} on ${date}`
}

function renderTransferFrom(action){
    const date = new Date(action.effectiveDate).toDateString();
    return  `${action.data.afterAmount} ${renderShareClass(action.data.shareClass)} on ${date}`
}

class RenderActions extends React.Component {

    renderAction(action) {
        switch(action.type){
            case 'ISSUE_TO':
                return renderIssue(action);
            case 'TRANSFER_TO':
                return renderTransferTo(action);
            case 'TRANSFER_FROM':
                return renderTransferFrom(action);
            default:
                return false;
        }
    };

    render() {
        return <ul>
            { this.props.actions.map((action, i) => {
                return <li key={i}> { this.renderAction(action) }</li>
            })}
        </ul>
    };
}


@connect((state, ownProps) => {
    return {data: {}, ...state.resources['/company/'+ownProps.params.id +'/share_register']}
})
export class ShareRegister extends React.Component {
    static propTypes = {
        data: PropTypes.object.isRequired,
    };
    fields = ['shareClass', 'name', 'address', 'restrictions', 'amount', 'issueHistory', 'repurchaseHistory', 'transferHistoryFrom', 'transferHistoryTo'];
    key() {
        return this.props.params.id
    };

fetch() {
        return this.props.dispatch(requestResource('/company/'+this.key()+'/share_register'))
    };

    componentDidMount() {
        this.fetch();
    };

    componentDidUpdate() {
        this.fetch();
    };

    renderField(key, data) {
        if(Array.isArray(data)){
            return  <RenderActions actions={data}/>
        }
        switch(key){
            case 'shareClass':
                return renderShareClass(data);

            default:
                return data;
        }

    }

    renderTable(shareRegister) {
        return <table className="table table-responsive">
            <thead>
                <tr>{ this.fields.map((f, i) => {
                    return <th key={i}>{STRINGS.shareRegister[f]}</th>
                })}</tr>
            </thead>
            <tbody>
                { shareRegister.map((s, i) => {
                    return <tr key={i}>{ this.fields.map((f, j) => {
                        return <td key={j}>{this.renderField(f, shareRegister[i][f])}</td>
                    })}</tr>
                }) }
            </tbody>
        </table>
    }

    render() {
        const shareRegister = (this.props.data || {}).shareRegister;
        if(!shareRegister){
            return <div className="loading"></div>
        }
        return <div>
                    <div className="container">
                        <div className="well">
                            <h3>Share Register</h3>
                            <LawBrowserLink title="Companies Act 1993" location="s 87">s 87 of the Companies Act 1993</LawBrowserLink>
                        </div>
                    </div>
                    <div className="container-fluid">
                            {this.renderTable(shareRegister)}
                    </div>
                </div>
    }
}


@connect((state, ownProps) => {
    return {data: {}, ...state.resources['/company/'+ownProps.params.id +'/transactions']}
})
export class CompanyTransactions extends React.Component {
    static propTypes = {
        data: PropTypes.object.isRequired,
    };

    key() {
        return this.props.params.id
    }

    fetch() {
        return this.props.dispatch(requestResource('/company/'+this.key()+'/transactions'))
    };

    componentDidMount() {
        this.fetch();
    };

    componentDidUpdate() {
        this.fetch();
    };

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
        return <div className="container">
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
export class CompanyHistory extends React.Component {
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
        if(this.props._status==='error'){
            return <NotFound descriptor="Company"/>
        }
        if(!current){
            return <div className="loading"> <Glyphicon glyph="refresh" className="spin"/></div>
        }
        const generation = Number(this.props.params.generation) || 0;
        return <div className="container">
                <div className="well">
                { generation ? <h4>As at {new Date(current.transaction.effectiveDate).toDateString() }</h4> : null}
                    <h1>{current.companyName}</h1>
                    <h5>#{current.companyNumber}, {current.companyStatus}</h5>
                </div>
                <ul className="pager">
                    { current.previousCompanyStateId ?
                        <li className="previous"><Link activeClassName="active" className="nav-link" to={"/company/view/"+this.props.params.id+"/history/"+(generation+1)} >← Previous Version</Link></li> : null}

                    { generation > 1 ?
                        <li className="next"><Link activeClassName="active" className="nav-link" to={"/company/view/"+this.props.params.id+"/history/"+(generation-1)} >Next Version →</Link></li> : null}

                    { generation === 1 ?
                        <li className="next"><Link activeClassName="active" className="nav-link" to={"/company/view/"+this.props.params.id} >Current Version</Link></li> : null}
              </ul>
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



@connect((state, ownProps) => {
    return {data: {}, companyPage: state.companyPage, ...state.resources['/company/'+ownProps.params.id +'/get_info']};
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
        this.props.dispatch(requestResource('/company/' + this.key() + '/get_info'));
    }

    componentDidMount() {
        this.fetch();

    }

    componentDidUpdate() {
        this.fetch();
    }

    render(){
        const data = this.props.data || {};
        const current = data.currentCompanyState || data.companyState;
        if(this.props._status==='error'){
            return <NotFound descriptor="Company"/>
        }
        if(!current){
            return <div className="loading"> <Glyphicon glyph="refresh" className="spin"/></div>
        }
        return <div>
                <div className="container">
                <div className="well">
                    <h1>{current.companyName}</h1>
                    <h5>#{current.companyNumber}, {current.companyStatus}</h5>
                     <h5>{new Date(current.transaction.effectiveDate).toDateString() }</h5>
                </div>
                { this.props.children && <ul className="pager">
                            <li><Link className="nav-link" to={"/company/view/"+this.props.params.id}>← Back to Dashboard</Link></li>
                            </ul>
                        }
                </div>
                { this.props.children && React.cloneElement(this.props.children, {
                        companyState: current
                })}
                { !this.props.children &&
                    <div className="container">
                    <div className="row">
                        <div className="col-md-6">
                        <Link to={this.props.location.pathname +'/shareregister'}>
                             <ShareRegisterPanel />
                                 </Link>
                        </div>
                         <div className="col-md-6">
                        <Link to={this.props.location.pathname +'/shareholdings'}>
                             <ShareholdingsPanel
                                holdings={current.holdings}
                                totalShares={current.totalShares}
                                totalAllocatedShares={current.totalAllocatedShares} />
                                </Link>
                        </div>
                         <div className="col-md-6">
                        <Link to={this.props.location.pathname +'/details'}>
                             <DetailsPanel
                                companyState={current} />
                                </Link>
                        </div>
                          <div className="col-md-6">
                        <Link to={this.props.location.pathname +'/transactions'}>
                             <TransactionsPanel
                                transactions={current.transactions} />
                                </Link>
                        </div>
                        </div>
                    </div> }
        </div>
    }
}
