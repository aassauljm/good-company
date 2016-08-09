"use strict";
import React, {PropTypes} from 'react';
import { requestResource, updateMenu } from '../actions';
import { pureRender, numberWithCommas, stringToDate, generateShareClassMap, renderShareClass, joinAnd } from '../utils';
import { connect } from 'react-redux';
import STRINGS from '../strings';
import LawBrowserLink from './lawBrowserLink'
import { renderRights, renderLimitations } from './shareClasses';
import Input from './forms/input';
import { asyncConnect } from 'redux-connect';
import { Link } from 'react-router';
import { enums as TransactionTypes } from '../../../config/enums/transactions';

function transferHolders(filter, siblings){
    if(!siblings){
        return 'UNKNOWN';
    }
    else{
        return joinAnd(siblings.filter(s => s.type === filter).map(s => {
            return joinAnd((s.holding_persons).map(h => h.name))
        }))
    }
}

function transferSenders(siblings){
    return transferHolders(TransactionTypes.TRANSFER_FROM, siblings);
}

function transferRecipients(siblings){
    return transferHolders(TransactionTypes.TRANSFER_TO, siblings);
}

// all the same
function renderChange(action, shareClassMap){
    const date = stringToDate(action.effectiveDate);
    return `${numberWithCommas(action.data.amount)} ${renderShareClass(action.data.shareClass, shareClassMap)} on ${date}`
}

function renderTransferTo(action, shareClassMap){
    const date = stringToDate(action.effectiveDate);
    return  `${numberWithCommas(action.data.amount)} ${renderShareClass(action.data.shareClass, shareClassMap)} on ${date}`
}

function renderTransferFrom(action, shareClassMap){
    const date = stringToDate(action.effectiveDate);
    return  `${numberWithCommas(action.data.amount)} ${renderShareClass(action.data.shareClass, shareClassMap)} on ${date}`
}

function renderChangeFull(action, shareClassMap){
    return `${STRINGS.transactionVerbs[action.type]} of ${numberWithCommas(action.data.amount)} ${renderShareClass(action.data.shareClass, shareClassMap)}`
}

function renderConversionFull(action, shareClassMap){
    return `${STRINGS.transactionVerbs[action.type]} of ${numberWithCommas(action.data.beforeAmount)} ${renderShareClass(action.data.shareClass, shareClassMap)} to ${numberWithCommas(action.data.afterAmount)} ${renderShareClass(action.data.shareClass, shareClassMap)}`
}


function renderTransferToFull(action, shareClassMap){
    return  `${STRINGS.transactionVerbs[action.type]} of ${numberWithCommas(action.data.amount)} ${renderShareClass(action.data.shareClass, shareClassMap)} from ${transferSenders(action.siblings)}`
}

function renderTransferFromFull(action, shareClassMap){
    return  `${STRINGS.transactionVerbs[action.type]} of ${numberWithCommas(action.data.amount)} ${renderShareClass(action.data.shareClass, shareClassMap)} to ${transferRecipients(action.siblings)}`
}

/*function renderHoldingChange(action, shareClassMap){
    if(action.inPreviousHolding){
        return  `Transfer of ${numberWithCommas(action.amount)} ${renderShareClass(action.shareClass, shareClassMap)} to ${joinAnd((action.data.afterHolders).map(h => h.name))}`;
    }
    else{
        return  `Transfer of ${numberWithCommas(action.amount)} ${renderShareClass(action.shareClass, shareClassMap)} from ${joinAnd((action.data.beforeHolders).map(h => h.name))}`;
    }
}*/

function renderAmbigiousChangeFull(action, shareClassMap){
    if(action.type === TransactionTypes.NEW_ALLOCATION || action.data.afterAmount > action.data.beforeAmount){
        return  `Ambiguous increase of ${numberWithCommas(action.data.amount)} ${renderShareClass(action.data.shareClass, shareClassMap)}`;
    }
    else{
        return  `Ambiguous decrease of ${numberWithCommas(action.data.amount)} ${renderShareClass(action.data.shareClass, shareClassMap)}`
    }
}

function renderAction(action, shareClassMap) {
    switch(action.type){
        case TransactionTypes.ISSUE_TO:
        case TransactionTypes.SUBVISION_TO:
        case TransactionTypes.CONVERSION_TO:
            return renderChange(action, shareClassMap);
        case TransactionTypes.TRANSFER_TO:
            return renderTransferTo(action, shareClassMap);
        case TransactionTypes.TRANSFER_FROM:
            return renderTransferFrom(action, shareClassMap);
        //case TransactionTypes.HOLDING_CHANGE:
        //    return renderHoldingChange(action, shareClassMap);
        case TransactionTypes.PURCHASE_FROM:
        case TransactionTypes.REDEMPTION_FROM:
        case TransactionTypes.ACQUISITION_FROM:
        case TransactionTypes.CONSOLIDATION_FROM:
            return renderChange(action, shareClassMap);
        default:
            return false;
    }
};

function renderActionFull(action, shareClassMap) {
    switch(action.type){
        case 'ISSUE_TO':
            return renderChangeFull(action, shareClassMap);
        case 'SUBVISION_TO':
        case 'CONVERSION_TO':
            return renderConversionFull(action, shareClassMap);
        case 'TRANSFER_TO':
            return renderTransferToFull(action, shareClassMap);
        case 'TRANSFER_FROM':
            return renderTransferFromFull(action, shareClassMap);
        case 'PURCHASE_FROM':
        case 'REDEMPTION_FROM':
        case 'ACQUISITION_FROM':
        case 'CONSOLIDATION_FROM':
            return renderChangeFull(action, shareClassMap);
        //case TransactionTypes.HOLDING_CHANGE:
        //    return renderHoldingChange(action, shareClassMap);
        case TransactionTypes.AMEND:
        case TransactionTypes.REMOVE_ALLOCATION:
        case TransactionTypes.NEW_ALLOCATION:
            return renderAmbigiousChangeFull(action, shareClassMap);
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
                return <li key={i}> { renderAction(action, this.props.shareClassMap) }</li>
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
            const props = ((shareClassMap[row.shareClass] || {}).properties || {})
            let limitations = props.limitations;
            if(props.transferRestriction){
                limitations.push(STRINGS.shareClasses.transferRestriction);
                if(props.transferRestrictionDocument){
                    limitations.push(`${STRINGS.shareClasses.transferRestrictionDocument}: ${props.transferRestrictionDocument}`)
                }
            }
            return renderLimitations(limitations);
        case 'current':
            return data ? 'Yes': 'No';
        case 'amount':
        case 'sum':
            return numberWithCommas(data);
        default:
            return data;
    }
}

function transactionRows(row, shareClassMap){
    const keys = ['issueHistory', 'repurchaseHistory', 'transferHistoryFrom', 'transferHistoryTo', 'ambiguousChanges', 'holdingChanges'];
    let results = [];
    keys.map(k => {
        results = results.concat(row[k] || []);
    })
    if(!results.length){
        return <tr><td colSpan="2"><em>No transaction history</em></td></tr>
    }
    results.sort((a, b) => a.generation - b.generation);
    let total = row.last_amount;
    return results.map((r, i) =>{
        const _total = total
        //if(increaseTypes.indexOf(r.type) >= 0){
        if(r.data.beforeAmount < r.data.afterAmount){
            total -= r.data.amount;
        }
        else{
            total += r.data.amount;
        }
        return <tr key={i}>
            <td className="date">{ stringToDate(r.effectiveDate) }</td>
            <td className="description">{ renderActionFull(r, shareClassMap) } </td>
            {/* <td className="total">{ numberWithCommas(_total) }</td> */ }
            </tr>
    });
}


export class ShareRegisterTable extends React.Component {
    static propTypes = {
        shareRegister: PropTypes.array.isRequired,
        shareClassMap: PropTypes.object.isRequired
    };

    fields = ['shareClass', 'name', 'address', 'holdingName', 'current', 'amount', 'sumIncreases', 'votingRights', 'limitations', 'issueHistory', 'repurchaseHistory', 'transferHistoryFrom', 'transferHistoryTo'];
    wideFields = {'name': 1, 'address': 1, 'votingRights': 1, 'limitations': 1, 'issueHistory': 1, 'repurchaseHistory': 1, 'transferHistoryFrom': 1, 'transferHistoryTo': 1};

    render() {
        const {shareRegister, shareClassMap} = this.props;
        return <div className="container-fluid shareregister-container">
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
        const properties = ((shareClassMap[k] || {}).properties || {})
        let limitations = properties.limitations;
        if(properties.transferRestriction){
            limitations.push(STRINGS.shareClasses.transferRestriction);
            if(properties.transferRestrictionDocument){
                limitations.push(`${STRINGS.shareClasses.transferRestrictionDocument}: ${properties.transferRestrictionDocument}`)
            }
        }
        return <div >
                <h4>{ renderShareClass(k, shareClassMap) }</h4>
                <div className="row"><div className="col-md-6">
                    <h5>{ STRINGS.shareRegister['votingRights'] }</h5>
                    { renderRights(properties.votingRights) }
                    </div>
                <div className="col-md-6">
                <h5>{ STRINGS.shareRegister['limitations'] }</h5>
                    { renderLimitations(limitations) }
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
                return <div key={i}><h5>{s.name} { s.holdingName && `(${s.holdingName})` } - {renderShareClass(s.shareClass, shareClassMap)} Shares</h5>
                 <table className="table share-register transaction-history">
                        <thead>
                        </thead>
                        <tbody>
                            { transactionRows(s, shareClassMap) }
                        </tbody>
                    </table>
                    </div>
            })}
            </div>
    }

    render() {
        const {shareRegister, shareClassMap, companyState} = this.props;
        const shareClasses = Object.keys(shareClassMap).map(s => parseInt(s, 10) || null);
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
            <div>Generated on { stringToDate() }</div>
            { this.renderShareClasses(shareClasses) }
            { this.renderHistory(shareClasses) }

        </div>
    }
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

    renderShareRegister() {
        const shareRegister = (this.props.data || {}).shareRegister;
        const shareClassMap = generateShareClassMap(this.props.companyState)
        if(!shareRegister){
            return <div className="loading"></div>
        }
        return <div>{ this.props.menu.view === 'document' &&
                        <div className="container shareregister-container">
                            <ShareRegisterDocument shareRegister={shareRegister} shareClassMap={shareClassMap} companyState={this.props.companyState}/>
                        </div> }
                    { this.props.menu.view === 'table' && <ShareRegisterTable shareRegister={shareRegister} shareClassMap={shareClassMap} /> }
                </div>
    }

    renderTop() {
        return <div className="container">
            <div className="row">
                <div className="widget">
                    <div className="widget-header">
                        <div className="widget-title">
                            Share Register
                        </div>
                    </div>
                    <div className="widget-body">
                        <LawBrowserLink title="Companies Act 1993" location="s 87">As defined under s 87 of the Companies Act 1993</LawBrowserLink>
                    </div>
            </div>

            </div>
        </div>
    }

    renderControls() {
        return <div className="container">
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
    }

    render() {
        return <div>
            { this.renderTop() }
            { this.renderControls() }
            { this.renderShareRegister() }
        </div>
    }
}



