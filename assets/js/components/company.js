"use strict";
import React, {PropTypes} from 'react';
import {requestResource, changeCompanyTab, showModal, toggleWidget } from '../actions';
import { pureRender, numberWithCommas, stringToDate } from '../utils';
import { connect } from 'react-redux';
import ButtonInput from './forms/buttonInput';
import CompanyHeader from  './companyHeader';
import { Link } from 'react-router';
import Panel from './panel';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import STRINGS from '../strings';
import LawBrowserLink from './lawBrowserLink'
import { asyncConnect } from 'redux-connect';
import { ShareholdingsWidget } from './shareholdings';
import { RecentCompanyActivityWidget } from './recentActivity';
import { CompaniesRegisterWidget } from './companiesRegister';
import { ContactDetailsWidget } from './contactDetails';
import { DirectorsWidget } from './directors';
import { DocumentsWidget } from './documents';
import { ReportingDetailsWidget } from './reportingDetails';

import NotFound from './notFound';
import BarGraph from './graphs/bar'
import Notifications from './notifications';



@pureRender
export class TransactionsPanel extends React.Component {
    static propTypes = {
        transactions: PropTypes.array.isRequired
    };

    render() {
        const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const data = this.props.transactions;
        const groups = data.reduce((acc, value) => {
            const parts = (value.effectiveDate || '').split('-');
            const key = `${parts[0]}-${parts[1]}`;
            acc[key] = (acc[key] || 0) + (value.actionCount || 1);
            return acc;
        }, {})

        const firstDate = new Date(data[Math.min(data.length-1, 12)].effectiveDate);
        const lastDate = new Date(data[0].effectiveDate);
        const graphData = [];

        for(let i=firstDate.getFullYear(); i<=lastDate.getFullYear(); i++){
            for(let j=1; j<=12; j++){
                const key = `${i}-${("0"+j).slice(-2)}`;
                graphData.push({y:  groups[key] ?  groups[key] : 0, x: key, label: `${monthShort[j-1]} ${i}`});
                if(i === lastDate.getFullYear() && j > lastDate.getMonth()){
                    break;
                }
            }
        }

        return <div className="panel panel-success" >
            <div className="panel-heading">
            <h3 className="panel-title">Transactions</h3>
            </div>
            <div className="panel-body">
            <div><strong>Last Transaction </strong>
            {(STRINGS.transactionTypes[this.props.transactions[0].type] || this.props.transactions[0].type ) + ' ' }
             { stringToDate(this.props.transactions[0].effectiveDate) }</div>
            </div>
            <BarGraph data={graphData} />

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
                <td rowSpan={rowSpan}>{ stringToDate(t.transaction.effectiveDate) }</td>
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
        return  <div><Link to={`/company/view/${this.props.companyId}/share_classes`} className="text-danger alert-entry"> <Glyphicon glyph="warning-sign" className="big-icon"/>
        You need to specify share classes.  Click here to start.</Link></div>
    }
}

const AlertWarnings = {
    ApplyShareClasses: ApplyShareClasses,
}


@pureRender
class CompanyAlertsWidget extends React.Component {
    static propTypes = {
        companyState: PropTypes.object.isRequired,
        companyId: PropTypes.string.isRequired,
    };
    render(){
        const shareWarning = (!this.props.companyState.shareClasses || !this.props.companyState.shareClasses.shareClasses) ;

        if(!shareWarning){
            return false;
        }
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    Notifications
                </div>
                <div className="widget-control">
                <Link to="/alerts" >View All</Link>
                </div>
            </div>

            <div className="widget-body">
                <ul>
                { shareWarning && <li><AlertWarnings.ApplyShareClasses companyId={this.props.companyId}/></li>}
                </ul>
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
                { generation ? <h4>As at {stringToDate(current.transaction.effectiveDate) }</h4> : null}
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
                    <dd >{stringToDate(current.incorporationDate)}</dd>

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
export class CompanyLoader extends React.Component {
    render() {
        if(!this.props.data.currentCompanyState){
            return false;
        }
        return React.cloneElement(this.props.children, {
                companyState: this.props.data.currentCompanyState,
                companyId: this.props.params.id
            })
    }
}


/*
<div className="well">
    <h1>{current.companyName}</h1>
    { current.companyNumber && <h5><Link target="_blank" to={ companiesOfficeUrl }>#{current.companyNumber}, {current.companyStatus}</Link></h5> }
    <h5>As at {stringToDate(current.transaction.effectiveDate) }</h5>
</div>

*/

function analyseCompany(company){
    company.currentCompanyState.holders = company.currentCompanyState.holdingList.holdings.reduce((acc, holding) => {
        holding.holders.reduce((acc, holder) => {
            acc[holder.personId] = (acc[holder.personId] || []).concat([holding.holdingId])
            return acc
        }, acc)
        return acc;
    }, {});
    return company;
}


const DEFAULT_OBJ = {};


@asyncConnect([{
    key: 'company',
    promise: ({store: {dispatch, getState}, params}) => {
        return dispatch(requestResource('/company/' + params.id + '/get_info', {postProcess: analyseCompany}));
    }
}],(state, ownProps) => {
    return {
        data: DEFAULT_OBJ,
        companyPage: state.companyPage,
        widgets: state.widgets[ownProps.params.id] || DEFAULT_OBJ,
         ...state.resources['/company/'+ownProps.params.id +'/get_info']};
},
{
    requestData: (id) => requestResource('/company/' + id + '/get_info', {postProcess: analyseCompany}),
    showModal: (key, data) => showModal(key, data),
    toggleWidget: (path, args) => toggleWidget(path, args)
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

    fetch() {
        return this.props.requestData(this.key());
    };

    componentDidMount() {
        this.fetch();
    };

    componentDidUpdate() {
        this.fetch();
    };


    renderBody(current) {
        if(!current){
             return <div className="loading"> <Glyphicon glyph="refresh" className="spin"/></div>
        }

        if(this.props.children){
            return React.cloneElement(this.props.children, {
                        companyState: current,
                        companyId: this.key(),
                        showModal: (key, data) => this.props.showModal(key, data)
                });
        }
        else{
            return <div className="container">

            <div className="row">
                 <div className="col-md-6">
                <CompaniesRegisterWidget
                    toggle={(expanded) => this.props.toggleWidget([this.key(), 'companiesRegister'], expanded) }
                    expanded={(this.props.widgets.companiesRegister || {}).expanded}
                    companyState={current}
                    companyId={this.props.params.id}
                 />
                    <ReportingDetailsWidget
                        toggle={(expanded) => this.props.toggleWidget([this.key(), 'reporting'], expanded) }
                        expanded={(this.props.widgets.reporting || {}).expanded}
                        companyState={current}
                        companyId={this.props.params.id}
                     />

                 <RecentCompanyActivityWidget
                    toggle={(expanded) => this.props.toggleWidget([this.key(), 'recentActivity'], expanded) }
                    expanded={(this.props.widgets.recentActivity || {}).expanded}
                    companyState={current}
                    companyId={this.props.params.id}
                 />
                </div>
                 <div className="col-md-6">
                     <ShareholdingsWidget
                        toggle={(expanded) => this.props.toggleWidget([this.key(), 'shareholdings'], expanded) }
                        expanded={(this.props.widgets.shareholdings || {}).expanded}
                        companyState={current}
                        companyId={this.props.params.id}
                     />

                    <ContactDetailsWidget
                        toggle={(expanded) => this.props.toggleWidget([this.key(), 'companiesRegister'], expanded) }
                        expanded={(this.props.widgets.companiesRegister || {}).expanded}
                        companyState={current}
                        companyId={this.props.params.id}
                     />
                    <DirectorsWidget
                        toggle={(expanded) => this.props.toggleWidget([this.key(), 'directors'], expanded) }
                        expanded={(this.props.widgets.directors || {}).expanded}
                        companyState={current}
                        companyId={this.props.params.id}
                     />

                    <DocumentsWidget
                        toggle={(expanded) => this.props.toggleWidget([this.key(), 'documents'], expanded) }
                        expanded={(this.props.widgets.documents || {}).expanded}
                        companyState={current}
                        companyId={this.props.params.id}
                     />
                </div>

                </div>
            </div>
        }
    }

    render(){
        const data = this.props.data || DEFAULT_OBJ;
        const current = data.currentCompanyState || data.companyState;
        if(this.props._status === 'error'){
            return <NotFound descriptor="Company" />
        }
        return <div className="company">
                <CompanyHeader companyId={this.key()} companyState={current || {}}/>
                <div className="company-page">
                    <div className="container-fluid page-top">
                    <Notifications />
                     <div className="container">
                        <div className="row">
                             <div className="col-md-12">
                                { current && <CompanyAlertsWidget companyId={this.key()}  companyState={current} /> }
                             </div>
                        </div>
                    { this.props.children &&  <ul className="pager">
                            <li ><Link activeClassName="active" className="nav-link" to={"/company/view/"+this.props.params.id} >← Company Page</Link></li>
                            </ul> }
                    </div>

                    </div>
                    <div className="container-fluid page-body">
                        { this.renderBody(current) }

            </div>
            </div>
        </div>
    }
}
