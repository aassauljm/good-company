"use strict";
import React, {PropTypes} from 'react';
import {requestResource, changeCompanyTab, showModal } from '../actions';
import { pureRender, numberWithCommas } from '../utils';
import { connect } from 'react-redux';
import ButtonInput from './forms/buttonInput';
import LookupCompany from  './lookupCompany';
import { Link } from 'react-router';
import Panel from './panel';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import STRINGS from '../strings';
import LawBrowserLink from './lawBrowserLink'
import { asyncConnect } from 'redux-async-connect';
import { ShareholdingsPanel } from './shareholdings';
import { DocumentsPanel } from './documents';
import { NewTransactionPanel } from './newTransaction';
import { ShareClassesPanel } from './shareClasses';
import { DetailsPanel } from './companyDetails';
import { InterestsRegisterPanel } from './interestsRegister';
import { ShareRegisterPanel } from './shareRegister';
import { ShareholdersPanel } from './shareholders';
import NotFound from './notFound';


@pureRender
export class TransactionsPanel extends React.Component {
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
            {(STRINGS.transactionTypes[this.props.transactions[0].type] || this.props.transactions[0].type ) + ' ' }
             {new Date(this.props.transactions[0].effectiveDate).toDateString()}</div>
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

    show(data) {
        this.props.dispatch(showModal('transaction', data));
    }

    rows(transactions) {
        const rows = [];
        transactions.map((t, i) => {
            const rowSpan = (t.transaction.subTransactions ? t.transaction.subTransactions.length : 0) + 1;
            rows.push(<tr key={i} onClick={() => this.show(t.transaction)}>
                <td rowSpan={rowSpan}>{ t.transaction.transactionId }</td>
                <td rowSpan={rowSpan}>{ new Date(t.transaction.effectiveDate).toDateString() }</td>
                <td rowSpan={rowSpan}>{ STRINGS.transactionTypes[t.transaction.type] }</td>
                { !t.transaction.subTransactions && <td></td> }
            </tr>);
            (t.transaction.subTransactions || []).map((t, j) => {
                rows.push(<tr key={i+'-'+j} onClick={() => this.show(t)}><td>{STRINGS.transactionTypes[t.type]}</td></tr>)
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




@pureRender
class ApplyShareClasses extends React.Component {
    render(){
        return  <div ><Link to={this.props.path +'/share_classes'} className="text-danger alert-entry"> <Glyphicon glyph="warning-sign" className="big-icon"/>
        You need to specify share classes.  Click here to start.</Link></div>
    }
}

const AlertWarnings = {
    ApplyShareClasses: ApplyShareClasses,
}


@pureRender
class Alerts extends React.Component {
    static propTypes = {
        companyState: PropTypes.object.isRequired
    };
    render(){
        const shareWarning = (!this.props.companyState.shareClasses || !this.props.companyState.shareClasses.shareClasses) ;

        if(!shareWarning){
            return false;
        }
        return <div className="panel panel-default" >
            <div className="panel-heading">
            <h3 className="panel-title">Notifications</h3>
            </div>
            <div className="panel-body">
                { shareWarning && <AlertWarnings.ApplyShareClasses path={this.props.path}/>}
            </div>
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


@asyncConnect([{
    key: 'company',
    promise: ({store: {dispatch, getState}, params}) => {
        return dispatch(requestResource('/company/' + params.id + '/get_info'));
    }
}])
@connect((state, ownProps) => {
    return {data: {}, companyPage: state.companyPage, ...state.resources['/company/'+ownProps.params.id +'/get_info']};
})
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

    render(){
        const data = this.props.data || {};
        const current = data.currentCompanyState || data.companyState;
        if(this.props._status === 'error'){
            return <NotFound descriptor="Company" />
        }
        if(!current){
            return <div className="loading"> <Glyphicon glyph="refresh" className="spin"/></div>
        }
        const companiesOfficeUrl = `http://www.business.govt.nz/companies/app/ui/pages/companies/${current.companyNumber}`;
        return <div>
                <div className="container">
                <div className="well">
                    <h1>{current.companyName}</h1>
                    { current.companyNumber && <h5><Link target="_blank" to={ companiesOfficeUrl }>#{current.companyNumber}, {current.companyStatus}</Link></h5> }
                    <h5>As at {new Date(current.transaction.effectiveDate).toDateString() }</h5>
                </div>
                { this.props.children && <ul className="pager">
                            <li><Link className="nav-link" to={"/company/view/"+this.props.params.id}>← Back to Dashboard</Link></li>
                            </ul>
                        }
                </div>
                { this.props.children && React.cloneElement(this.props.children, {
                        companyState: current,
                        companyId: this.key(),
                        showModal: (key, data) => this.props.dispatch(showModal(key, data))
                })}
                { !this.props.children &&
                    <div className="container">
                    <div className="row">
                         <div className="col-md-12">
                            <Alerts companyState={current} path={this.props.location.pathname}/>
                         </div>
                    </div>
                    <div className="row">
                         <div className="col-md-6">
                        <Link to={this.props.location.pathname +'/details'}>
                             <DetailsPanel
                                companyState={current} />
                                </Link>
                        <Link to={this.props.location.pathname +'/shareregister'}>
                             <ShareRegisterPanel />
                                 </Link>
                        <Link to={this.props.location.pathname +'/shareholdings'}>
                             <ShareholdingsPanel
                                holdings={current.holdingList.holdings}
                                totalShares={current.totalShares}
                                totalAllocatedShares={current.totalAllocatedShares} />
                                </Link>
                         <Link to={this.props.location.pathname +'/documents'}>
                             <DocumentsPanel docList={current.docList}/>
                                </Link>
                        </div>
                          <div className="col-md-6">
                        <Link to={this.props.location.pathname +'/new_transaction'}>
                             <NewTransactionPanel />
                                </Link>
                        <Link to={this.props.location.pathname +'/share_classes'}>
                             <ShareClassesPanel />
                                </Link>
                        <Link to={this.props.location.pathname +'/transactions'}>
                             <TransactionsPanel
                                transactions={current.transactions} />
                                </Link>

                        <Link to={this.props.location.pathname +'/shareholders'}>
                             <ShareholdersPanel
                                transactions={current.transactions} />
                                </Link>

                        <Link to={this.props.location.pathname +'/interests_register'}>
                             <InterestsRegisterPanel />
                                </Link>
                        </div>
                        </div>
                    </div> }
        </div>
    }
}
