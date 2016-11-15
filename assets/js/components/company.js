"use strict";
import React, {PropTypes} from 'react';
import { requestResource, changeCompanyTab, showModal, toggleWidget, resetModals } from '../actions';
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
import { TransactionWidget } from './transactions';
import { PendingTransactionsWidget } from './pendingTransactions';
import NotFound from './notFound';
import Notifications from './notifications';
import { push } from 'react-router-redux'
import Header from './header';
import { CompanyAlertsWidget } from './companyAlerts';


export function analyseCompany(company){
    // create a list of holders for a c
    company.currentCompanyState.holdingList = company.currentCompanyState.holdingList || {holdings: []};
    company.currentCompanyState.directorList = company.currentCompanyState.directorList || {directors: []};
    company.currentCompanyState.holders = company.currentCompanyState.holdingList.holdings.reduce((acc, holding) => {
        holding.holders.reduce((acc, holder) => {
            acc[holder.person.personId] = (acc[holder.person.personId] || []).concat([holding.holdingId]);
            return acc
        }, acc)
        return acc;
    }, {});
    company.currentCompanyState.holdingList.holdings.sort((a, b) => a.name.localeCompare(b.name))
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
         ...state.resources['/company/'+ownProps.params.id +'/get_info']};
}, (dispatch, ownProps) => ({
    requestData: (id) => dispatch(requestResource('/company/' + id + '/get_info', {postProcess: analyseCompany}))
}))
export class CompanyLoader extends React.Component {
    key() {
        return this.props.params.id
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

    render() {
        return React.cloneElement(this.props.children, {
                    companyState: this.props.data.currentCompanyState,
                    companyId: this.key()
            });
    }
}


const FAKE_COMPANY = {
    holdingList: {holdings: []}, warnings: {}
};


@asyncConnect([{
    key: 'company',
    promise: ({store: {dispatch, getState}, params}) => {
        return dispatch(requestResource('/company/' + params.id + '/get_info', {postProcess: analyseCompany}));
    }
}], (state, ownProps) => {
    return {
        companyPage: state.companyPage,
        widgets: state.widgets[ownProps.params.id] || DEFAULT_OBJ,
        modals: state.modals,
        data: DEFAULT_OBJ,
         ...state.resources['/company/'+ownProps.params.id +'/get_info']};
},
(dispatch, ownProps) => ({
    requestData: (id) => dispatch(requestResource('/company/' + id + '/get_info', {postProcess: analyseCompany})),
    showModal: (key, data) => dispatch(showModal(key, data)) && dispatch(push(`/company/view/${ownProps.params.id}/new_transaction`)),
    toggleWidget: (path, args) => dispatch(toggleWidget(path, args)),
    push: (url) => dispatch(push(url))
}))
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
                        push: this.props.push,
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

                 <RecentCompanyActivityWidget
                    toggle={(expanded) => this.props.toggleWidget([this.key(), 'recentActivity'], expanded) }
                    expanded={(this.props.widgets.recentActivity || {}).expanded}
                    companyState={current}
                    companyId={this.props.params.id}
                 />
                    <DocumentsWidget
                        toggle={(expanded) => this.props.toggleWidget([this.key(), 'documents'], expanded) }
                        expanded={(this.props.widgets.documents || {}).expanded}
                        companyState={current}
                        companyId={this.props.params.id}
                     />
                    { /* <ReportingDetailsWidget
                        toggle={(expanded) => this.props.toggleWidget([this.key(), 'reporting'], expanded) }
                        expanded={(this.props.widgets.reporting || {}).expanded}
                        companyState={current}
                        companyId={this.props.params.id}
                     /> */ }
                    <PendingTransactionsWidget
                        toggle={(expanded) => this.props.toggleWidget([this.key(), 'pendingTransactions'], expanded) }
                        expanded={(this.props.widgets.pendingTransactions || {}).expanded}
                        companyState={current}
                        companyId={this.props.params.id}
                     />

                    <TransactionWidget
                        toggle={(expanded) => this.props.toggleWidget([this.key(), 'transactions'], expanded) }
                        expanded={(this.props.widgets.transactions || {}).expanded}
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
                </div>

                </div>
            </div>
        }
    }

    render(){
        const data = this.props.data || DEFAULT_OBJ;
        const current = data.currentCompanyState || data.companyState;
        if(this.props._status === 'error'){
            return <div><Header />
                <NotFound descriptor="Company" />
            </div>
        }
        return <div className="company">
                <CompanyHeader companyId={this.key()} companyState={current || DEFAULT_OBJ} />
                <div className="company-page">
                    <div className="container-fluid page-top">
                    { <Notifications />}
                     <div className="container">
                        <div className="row">
                             <div className="col-md-12">
                                { current && !this.props.children && <CompanyAlertsWidget companyId={this.key()}  companyState={current} /> }
                             </div>
                        </div>

                    { false && this.props.children &&  <ul className="pager">
                            <li ><Link activeClassName="active" className="nav-link" to={"/"} >← Home</Link></li>
                            <li ><Link activeClassName="active" className="nav-link" to={"/company/view/"+this.props.params.id} >← Company Page</Link></li>
                            </ul> }
                    </div>

                    </div>
                    <div className="container-fluid page-body">
                        { this.renderBody(current || FAKE_COMPANY) }
                    </div>
            </div>
        </div>
    }
}
