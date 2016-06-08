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
import Modals from './modals';
import NotFound from './notFound';
import BarGraph from './graphs/bar'
import Notifications from './notifications';
import { push } from 'react-router-redux'


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
}], (state, ownProps) => {
    return {
        data: DEFAULT_OBJ,
        companyPage: state.companyPage,
        modals: state.modals,
        widgets: state.widgets[ownProps.params.id] || DEFAULT_OBJ,
         ...state.resources['/company/'+ownProps.params.id +'/get_info']};
},
{
    requestData: (id) => requestResource('/company/' + id + '/get_info', {postProcess: analyseCompany}),
    showModal: (key, data) => showModal(key, data),
    toggleWidget: (path, args) => toggleWidget(path, args),
    push: (url) => push(url)
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

        else if(this.props.children){
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
