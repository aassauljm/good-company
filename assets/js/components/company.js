"use strict";
import React, {PropTypes} from 'react';
import { requestResource, changeCompanyTab, showModal, toggleWidget } from '../actions';
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
import NotFound from './notFound';
import BarGraph from './graphs/bar'
import Notifications from './notifications';
import { push } from 'react-router-redux'



@pureRender
class SpecifyShareClasses extends React.Component {
    render(){
        return  <div><Link to={`/company/view/${this.props.companyId}/share_classes`} className="text-danger alert-entry"> <Glyphicon glyph="warning-sign" className="big-icon"/>
        You need to specify share classes.  Click here to start.</Link></div>
    }
}

@pureRender
class ApplyShareClasses extends React.Component {
    render(){
        return  <div><a href="#" onClick={this.props.startApplyShareClasses} className="text-danger alert-entry">
        <Glyphicon glyph="warning-sign" className="big-icon"/>
        You need to apply share classes to existing share allocations.  Click here to start.</a>
        </div>
    }
}

@pureRender
class PopulateHistory extends React.Component {
    render(){
        return  <div><a  href="#" onClick={this.props.startHistoryImport} className="text-danger alert-entry">
        <Glyphicon glyph="warning-sign" className="big-icon"/>
        Historic company activity needs to be imported.  Click here to start.</a>
        </div>
    }
}

const AlertWarnings = {
    ApplyShareClasses: ApplyShareClasses,
    PopulateHistory: PopulateHistory,
    SpecifyShareClasses: SpecifyShareClasses
};

@connect(() => DEFAULT_OBJ, (dispatch, ownProps) => {
    return {
        startHistoryImport: () => {
            dispatch(showModal('importHistory', {companyState: ownProps.companyState, companyId: ownProps.companyId}));
            dispatch(push(`/company/view/${ownProps.companyId}/new_transaction`));
        },
        startApplyShareClasses: () => {
            dispatch(showModal('applyShareClasses', {companyState: ownProps.companyState, companyId: ownProps.companyId}));
            dispatch(push(`/company/view/${ownProps.companyId}/new_transaction`));
        }
    }
})
class CompanyAlertsWidget extends React.Component {
    static propTypes = {
        companyState: PropTypes.object.isRequired,
        companyId: PropTypes.string.isRequired,
    };
    render(){
        const shareWarning = (!this.props.companyState.shareClasses || !this.props.companyState.shareClasses.shareClasses) ;
        const historyWarning = !!(this.props.companyState.warnings.pendingHistory);
        const applyShareWarning = !shareWarning && !!this.props.companyState.shareCountByClass['null'];
        if(!shareWarning && !historyWarning && !applyShareWarning){
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
                { shareWarning && <li><AlertWarnings.SpecifyShareClasses companyId={this.props.companyId}/></li>}
                { applyShareWarning && <li><AlertWarnings.ApplyShareClasses companyId={this.props.companyId} startApplyShareClasses={this.props.startApplyShareClasses}/></li>}
                { historyWarning && <li><AlertWarnings.PopulateHistory companyId={this.props.companyId} startHistoryImport={this.props.startHistoryImport}/></li>}
                </ul>
            </div>
        </div>
    }
}



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
         ...state.resources['/company/'+ownProps.params.id +'/get_info']};
})
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


@asyncConnect([{
    key: 'company',
    promise: ({store: {dispatch, getState}, params}) => {
        return dispatch(requestResource('/company/' + params.id + '/get_info', {postProcess: analyseCompany}));
    }
}], (state, ownProps) => {
    return {
        data: DEFAULT_OBJ,
        companyPage: state.companyPage,
        widgets: state.widgets[ownProps.params.id] || DEFAULT_OBJ,
        modals: state.modals,
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
                    <ReportingDetailsWidget
                        toggle={(expanded) => this.props.toggleWidget([this.key(), 'reporting'], expanded) }
                        expanded={(this.props.widgets.reporting || {}).expanded}
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
                    <TransactionWidget
                        toggle={(expanded) => this.props.toggleWidget([this.key(), 'transactions'], expanded) }
                        expanded={(this.props.widgets.transactions || {}).expanded}
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
