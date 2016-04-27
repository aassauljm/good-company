"use strict";
import React, {PropTypes} from 'react';
import { requestResource, updateMenu } from '../actions';
import { pureRender, numberWithCommas } from '../utils';
import { connect } from 'react-redux';
import STRINGS from '../strings';
import LawBrowserLink from './lawBrowserLink'
import { renderRights, renderLimitations } from './shareClasses';
import Input from './forms/input';
import { asyncConnect } from 'redux-async-connect';
import { Link } from 'react-router';


function renderShareClass(shareClass, shareClassMap = {}){
    return shareClassMap[shareClass] ? shareClassMap[shareClass].name : STRINGS.defaultShareClass
}

// all the same
function renderChange(action){
    const date = new Date(action.effectiveDate).toDateString();
    return `${numberWithCommas(action.data.amount)} ${renderShareClass(action.data.shareClass)} on ${date}`
}

function renderTransferTo(action){
    const date = new Date(action.effectiveDate).toDateString();
    return  `${numberWithCommas(action.data.amount)} ${renderShareClass(action.data.shareClass)} on ${date}`
}

function renderTransferFrom(action){
    const date = new Date(action.effectiveDate).toDateString();
    return  `${numberWithCommas(action.data.amount)} ${renderShareClass(action.data.shareClass)} on ${date}`
}


function renderChangeFull(action){
    return `${STRINGS.transactionVerbs[action.type]} of ${numberWithCommas(action.data.amount)} ${renderShareClass(action.data.shareClass)}`
}

function renderTransferToFull(action){
    return  `${STRINGS.transactionVerbs[action.type]} of ${numberWithCommas(action.data.amount)} ${renderShareClass(action.data.shareClass)} from TODO`
}

function renderTransferFromFull(action){
    return  `${STRINGS.transactionVerbs[action.type]} of ${numberWithCommas(action.data.amount)} ${renderShareClass(action.data.shareClass)} to TODO`
}

function renderAction(action) {
    switch(action.type){
        case 'ISSUE_TO':
        case 'SUBVISION_TO':
        case 'CONVERSION_TO':
            return renderChange(action);
        case 'TRANSFER_TO':
            return renderTransferTo(action);
        case 'TRANSFER_FROM':
            return renderTransferFrom(action);
        case 'PURCHASE_FROM':
        case 'REDEMPTION_FROM':
        case 'ACQUISITION_FROM':
        case 'CONSOLIDATION_FROM':
            return renderChange(action);
        default:
            return false;
    }
};

function renderActionFull(action) {
    switch(action.type){
        case 'ISSUE_TO':
        case 'SUBVISION_TO':
        case 'CONVERSION_TO':
            return renderChangeFull(action);
        case 'TRANSFER_TO':
            return renderTransferToFull(action);
        case 'TRANSFER_FROM':
            return renderTransferFromFull(action);
        case 'PURCHASE_FROM':
        case 'REDEMPTION_FROM':
        case 'ACQUISITION_FROM':
        case 'CONSOLIDATION_FROM':
            return renderChangeFull(action);
        default:
            return false;
    }
};

class RenderActions extends React.Component {
    static propTypes = {
        'actions': PropTypes.array.isRequired
    };


    render() {
        return <ul>
            { this.props.actions.map((action, i) => {
                return <li key={i}> { renderAction(action) }</li>
            })}
        </ul>
    };
}

function renderField(key, data, row, shareClassMap) {
    if(Array.isArray(data)){
        return  <RenderActions actions={data}/>
    }
    switch(key){
        case 'shareClass':
            return renderShareClass(data, shareClassMap);
        case 'votingRights':
            return renderRights(((shareClassMap[row.shareClass] || {}).properties || {}).votingRights);
        case 'limitations':
            return renderLimitations(((shareClassMap[row.shareClass] || {}).properties || {}).limitations);
        case 'current':
            return data ? 'Yes': 'No';
        case 'amount':
        case 'sum':
            return numberWithCommas(data);
        default:
            return data;
    }
}

function transactionRows(row){
    const keys = ['issueHistory', 'repurchaseHistory', 'transferHistoryFrom', 'transferHistoryTo'];
    const increaseTypes = ['ISSUE_TO', 'SUBVISION_TO', 'CONVERSION_TO', 'TRANSFER_TO'];
    let results = [];
    keys.map(k => {
        results = results.concat(row[k] || []);
    })
    if(!results.length){
        return <tr><td colSpan="3"><em>No transaction history</em></td></tr>
    }
    results.sort((a, b) => new Date(a.effectiveDate) < new Date(b.effectiveDate));
    let total = row.amount;
    return results.map((r, i) =>{
        const _total = total
        if(increaseTypes.indexOf(r.type) >= 0){
            total -= r.data.amount;
        }
        else{
            total += r.data.amount;
        }
        return <tr key={i}>
            <td className="date">{ new Date(r.effectiveDate).toDateString() }</td>
            <td className="description">{ renderActionFull(r) } </td>
            <td className="total">{ numberWithCommas(_total) }</td>
            </tr>
    });
}


export class ShareRegisterTable extends React.Component {
    static propTypes = {
        shareRegister: PropTypes.array.isRequired,
        shareClassMap: PropTypes.object.isRequired
    };

    fields = ['shareClass', 'name', 'address', 'holdingName', 'current', 'amount', 'sum', 'votingRights', 'limitations', 'issueHistory', 'repurchaseHistory', 'transferHistoryFrom', 'transferHistoryTo'];
    wideFields = {'name': 1, 'address': 1, 'votingRights': 1, 'limitations': 1, 'issueHistory': 1, 'repurchaseHistory': 1, 'transferHistoryFrom': 1, 'transferHistoryTo': 1};

    render() {
        const {shareRegister, shareClassMap} = this.props;
        return <div className="container-fluid">
                <div className="table-responsive">
               <table className="table share-register">
                    <thead>
                        <tr>{ this.fields.map((f, i) => {
                            return <th className={this.wideFields[f] ? 'wide' : null } key={i}>{STRINGS.shareRegister[f]}</th>
                        })}</tr>
                    </thead>
                    <tbody>
                        { shareRegister.map((s, i) => {
                            return <tr key={i}>{ this.fields.map((f, j) => {
                                return <td key={j}>{renderField(f, shareRegister[i][f], shareRegister[i], shareClassMap)}</td>
                            })}</tr>
                        }) }
                    </tbody>
                </table>
                </div>
            </div>
    }
}

export class ShareRegisterDocument extends React.Component {
    static propTypes = {
        shareRegister: PropTypes.array.isRequired,
        shareClassMap: PropTypes.object.isRequired,
        companyState: PropTypes.object.isRequired
    };

    currentFields = ['name', 'address', 'amount']

    renderShareClass(k) {
        const {shareRegister, shareClassMap} = this.props;
        return <div >
                <h4>{ renderShareClass(k, shareClassMap) }</h4>
                <div className="row"><div className="col-md-6">
                    <h5>{ STRINGS.shareRegister['votingRights'] }</h5>
                    { renderRights(((shareClassMap[k] || {}).properties || {}).votingRights) }
                    </div>
                <div className="col-md-6">
                <h5>{ STRINGS.shareRegister['limitations'] }</h5>
                    { renderLimitations(((shareClassMap[k] || {}).properties || {}).limitations) }
                    </div>
                    </div>
                { this.renderTable(k) }
            </div>
    }

    renderTable(k) {
        const {shareRegister, shareClassMap, companyState} = this.props;
        const rows = shareRegister.filter(s=>s.shareClass === k);
        if(!rows.length) {
            return 'No shareholdings with this class.'
        }
        return <table className="table share-register">
            <thead>
                <tr>{ this.currentFields.map((f, i) => {
                    return <th key={i}>{STRINGS.shareRegister[f]}</th>
                })}</tr>
            </thead>
            <tbody>
                { rows.map((s, i) => {
                    return <tr key={i}>{ this.currentFields.map((f, j) => {
                        return <td key={j} className={"share-register-"+f}>{renderField(f, shareRegister[i][f], shareRegister[i], shareClassMap)}</td>
                    })}</tr>
                }) }
                <tr>
                    <td colSpan={2}><strong>Total { renderShareClass(k, shareClassMap) } Shares on Issue </strong></td>
                    <td className="share-register-amount"><strong>{ numberWithCommas(companyState.shareCountByClass[k].amount) }</strong></td>
                </tr>
            </tbody>
        </table>
    }

    renderShareClasses(shareClasses) {
        return <div>
            <h3>Shareholders by Share Class</h3>
                { shareClasses.map((k, i) => {
                    return <div key={i}>{ this.renderShareClass(k) }</div>
                }) }

            </div>
    }

    renderHistory() {
        const {shareRegister, shareClassMap} = this.props;
        return <div>
            <h3>Transaction History</h3>
            { shareRegister.map((s, i) => {
                return <div key={i}><h5>{s.name} { s.holdingName && `(${s.holdingName})` }</h5>
                 <table className="table share-register transaction-history">
                        <thead>
                        </thead>
                        <tbody>
                            { transactionRows(s) }
                        </tbody>
                    </table>
                    </div>
            })}
            </div>
    }

    render() {
        const {shareRegister, shareClassMap, companyState} = this.props;
        const shareClasses = Object.keys(shareClassMap);
        let includeDefault = false;
        shareRegister.map(s => {
            if(!s.shareClass){
                includeDefault = true;
            }
        });
        if(includeDefault){
            shareClasses.push(null)
        }
        return <div className="share-register-document">
        <div className="title"><h2>Share Register</h2></div>
            <table className="heading">
                <tbody><tr>
                <td>
                <h2>{ companyState.companyName }</h2>
                </td>
                <td>
                <h4>NZBN: { companyState.nzbn }</h4>
                <h4>Company Number #{ companyState.companyNumber }</h4>
                </td>
                </tr>
                </tbody>
            </table>
            <div>Generated on { new Date().toDateString() }</div>
            { this.renderShareClasses(shareClasses) }
            { this.renderHistory(shareClasses) }

        </div>
    }
}

function generateShareClassMap(companyState){

    if(companyState.shareClasses && companyState.shareClasses.shareClasses){
        return companyState.shareClasses.shareClasses.reduce((acc, s) => {
            acc[s.id] = s;
            return acc;
        }, {});
    }
    return {};
}


@asyncConnect([{
    key: 'shareRegister',
    promise: ({store: {dispatch, getState}, params}) => {
        return dispatch(requestResource('/company/'+params.id+'/share_register'));
    }
}])
@connect((state, ownProps) => {
    return {data: {}, ...state.resources['/company/'+ownProps.params.id +'/share_register']}
})
export class ShareRegisterDocumentLoader extends React.Component {
    static propTypes = {
        data: PropTypes.object.isRequired,
        companyState: PropTypes.object.isRequired
    };
    render() {
        const shareRegister = (this.props.data || {}).shareRegister;
        if(!shareRegister){
            return false;
        }
        const shareClassMap = generateShareClassMap(this.props.companyState)
        return <ShareRegisterDocument shareRegister={shareRegister} shareClassMap={shareClassMap} companyState={this.props.companyState}/>
    }
}


@asyncConnect([{
    key: 'shareRegister',
    promise: ({store: {dispatch, getState}, params}) => {
        return dispatch(requestResource('/company/'+params.id+'/share_register'));
    }
}])
@connect((state, ownProps) => {
    return {data: {}, ...state.resources['/company/'+ownProps.params.id +'/share_register'], menu: state.menus.shareRegister}
})
export class ShareRegister extends React.Component {
    static propTypes = {
        data: PropTypes.object.isRequired,
        companyState: PropTypes.object.isRequired,
        companyId: PropTypes.string.isRequired
    };

    render() {
        const shareRegister = (this.props.data || {}).shareRegister;
        const shareClassMap = generateShareClassMap(this.props.companyState)
        if(!shareRegister){
            return <div className="loading"></div>
        }

        return <div>
                    <div className="container">
                        <div className="well">
                            <h3>Share Register</h3>
                            <LawBrowserLink title="Companies Act 1993" location="s 87">As defined under s 87 of the Companies Act 1993</LawBrowserLink>
                        </div>
                        <div className="col-md-4 col-md-offset-4">
                        <div className="button-row">
                            <Input type="select"
                            value={this.props.menu.view}
                            onChange={(e) => this.props.dispatch(updateMenu('shareRegister', {view: e.target.value}))}>
                            <option value="document">Document View</option>
                            <option value="table">Table View</option>
                            </Input>
                            <Link className="btn btn-primary" to={`/api/company/render/${this.props.companyId}/shareregister`} target='_blank'>Download</Link>
                        </div>
                        </div>
                    </div>
                    { this.props.menu.view === 'document' && <div className="container">
                        <ShareRegisterDocument shareRegister={shareRegister} shareClassMap={shareClassMap} companyState={this.props.companyState}/>
                        </div> }
                    { this.props.menu.view === 'table' && <ShareRegisterTable shareRegister={shareRegister} shareClassMap={shareClassMap} /> }
                </div>
    }
}



@pureRender
export class ShareRegisterPanel extends React.Component {
    static propTypes = {
    };
    render(){

        return <div className="panel panel-danger" >
            <div className="panel-heading">
            <h3 className="panel-title">Share Register</h3>
            </div>
            <div className="panel-body">
                View your Share Register, as defined under section 87 of the Companies Act 1993
            </div>
        </div>
    }
}

