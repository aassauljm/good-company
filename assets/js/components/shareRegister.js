"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import { requestResource, updateMenu } from '../actions';
import { pureRender, numberWithCommas, stringDateToFormattedString, generateShareClassMap, renderShareClass, joinAnd } from '../utils';
import { connect } from 'react-redux';
import STRINGS from '../strings';
import LawBrowserLink from './lawBrowserLink'
import LawBrowserContainer from './lawBrowserContainer'
import { renderRights, renderLimitations } from './shareClasses';
import Input from './forms/input';
import Download from './forms/download';
import { asyncConnect } from 'redux-connect';
import { Link } from 'react-router';
import { enums as TransactionTypes } from '../../../config/enums/transactions';
import { CompanyFromRouteHOC } from '../hoc/resources';
import { CompanyAlertsBase } from './companyAlerts';
import Widget from './widget';


const shareRegisterLawLinks = () => <div>
        <LawBrowserLink title="Companies Act 1993" location="s 87">Share register maintenance</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location=" 373(2)(b)+374(2)(9)">Penalties for non-compliance</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 84">Share transfer requirements</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 88">Location of share register</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 89">Share register as legal title</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 90">Director’s supervision of share register</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 91">Rectification of share register</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 92">No trusts on share register</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 93">Personal representatives of shareholders</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 94">Assignee of bankrupt shareholder</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 125">Ascertaining shareholders from share register</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="sch 1 cl 11">Votes of joint shareholders</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 189(1)(j)+(4)+(5)">Share register at registered office </LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 215(1)(c) + 217">Public inspection of share register </LawBrowserLink>
    </div>


function transferHolders(filter, siblings){
    if(!siblings){
        return 'UNKNOWN';
    }
    else{
        return joinAnd(siblings.filter(s => s.type === filter).map(s => {
            return joinAnd((s.holding_persons).map(h => {
                if((h.data||{}).heldPersonally === false){
                    return `${h.name} (${h.data.onBehalfType} of ${h.data.onBehalfDescription})`
                }
                return h.name;
            }))
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
    const date = stringDateToFormattedString(action.effectiveDate);
    return `${numberWithCommas(action.amount)} ${renderShareClass(action.shareClass, shareClassMap)} on ${date}`
}

function renderTransferTo(action, shareClassMap){
    const date = stringDateToFormattedString(action.effectiveDate);
    return  `${numberWithCommas(action.amount)} ${renderShareClass(action.shareClass, shareClassMap)} on ${date}`
}

function renderTransferFrom(action, shareClassMap){
    const date = stringDateToFormattedString(action.effectiveDate);
    return  `${numberWithCommas(action.amount)} ${renderShareClass(action.shareClass, shareClassMap)} on ${date}`
}

function renderChangeFull(action, shareClassMap){
    return `${STRINGS.transactionVerbs[action.type]} of ${numberWithCommas(action.amount)} ${renderShareClass(action.shareClass, shareClassMap)}`
}

function renderConversionFull(action, shareClassMap){
    return `${STRINGS.transactionVerbs[action.type]} of ${numberWithCommas(action.beforeAmount)} ${renderShareClass(action.shareClass, shareClassMap)} to ${numberWithCommas(action.afterAmount)} ${renderShareClass(action.shareClass, shareClassMap)}`
}

function renderTransferToFull(action, shareClassMap){
    return `${STRINGS.transactionVerbs[action.type]} of ${numberWithCommas(action.amount)} ${renderShareClass(action.shareClass, shareClassMap)} from ${transferSenders(action.siblings)}`
}

function renderTransferFromFull(action, shareClassMap){
    return `${STRINGS.transactionVerbs[action.type]} of ${numberWithCommas(action.amount)} ${renderShareClass(action.shareClass, shareClassMap)} to ${transferRecipients(action.siblings)}`
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
    if(action.type === TransactionTypes.NEW_ALLOCATION || action.afterAmount > action.beforeAmount){
        return `Ambiguous increase of ${numberWithCommas(action.amount)} ${renderShareClass(action.shareClass, shareClassMap)}`;
    }
    else{
        return `Ambiguous decrease of ${numberWithCommas(action.amount)} ${renderShareClass(action.shareClass, shareClassMap)}`
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
        case 'CONSOLIDATION_TO':
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
    const props = ((shareClassMap[row.shareClass] || {}).properties || {})
    switch(key){
        case 'shareClass':
            return renderShareClass(data, shareClassMap);
        case 'votingRights':
            return renderRights(((shareClassMap[row.shareClass] || {}).properties || {}).votingRights);
        case 'limitations':
            let limitations = props.limitations;
            if(props.transferRestriction){
                limitations.push(STRINGS.shareClasses.transferRestriction);
                if(props.transferRestrictionDocument){
                    limitations.push(`${STRINGS.shareClasses.transferRestrictionDocument}: ${props.transferRestrictionDocument}`)
                }
            }
            return renderLimitations(limitations);
        case 'transferRestriction':
            return props.transferRestriction ? STRINGS.shareRegister.hasTransferRestriction : STRINGS.shareRegister.hasNoTransferRestriction;
        case 'current':
            return data ? 'Yes': 'No';
        case 'last_amount':
        case 'amount':
        case 'sum':
            return numberWithCommas(data);
        case 'name':
            if((row.holderData||{}).heldPersonally === false){
                return `${data} (${row.holderData.onBehalfType} of ${row.holderData.onBehalfDescription})`
            };
            return data;

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
        return <tr><td colSpan="2"><em>No transaction history since { stringDateToFormattedString(row.startDate) } </em></td></tr>
    }
    results.sort((a, b) => a.generation - b.generation);

    return results.map((r, i) =>{
        return <tr key={i}>
            <td className="date">{ stringDateToFormattedString(r.effectiveDate) }</td>
            <td className="description">{ renderActionFull(r, shareClassMap) } </td>
             <td className="total">{ numberWithCommas(r.afterAmount) }</td>
            </tr>
    });
}


export class ShareRegisterTable extends React.Component {
    static propTypes = {
        shareRegister: PropTypes.array.isRequired,
        shareClassMap: PropTypes.object.isRequired
    };

    fields = ['shareClass', 'name', 'address', 'holdingName', 'current', 'amount', 'sumIncreases', 'votingRights', 'transferRestriction', 'issueHistory', 'repurchaseHistory', 'transferHistoryFrom', 'transferHistoryTo'];
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
                                return <td key={j}>{ renderField(f, shareRegister[i][f], shareRegister[i], shareClassMap) }</td>
                            }) }</tr>
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

    shareholderFields = ['name', 'address', 'amount']

    renderShareClassSection(k) {
        const {shareRegister, shareClassMap} = this.props;
        const properties = ((shareClassMap[k] || {}).properties || {})
        let limitations = properties.limitations;
        let transferRestriction = properties.transferRestriction;
        if(properties.transferRestriction){
            limitations.push(STRINGS.shareClasses.transferRestriction);
            if(properties.transferRestrictionDocument){
                limitations.push(`${STRINGS.shareClasses.transferRestrictionDocument}: ${properties.transferRestrictionDocument}`)
            }
        }
        return <div >
                <h4>{ renderShareClass(k, shareClassMap) }</h4>
                <div >
                    <div className="col-md-6">
                        <h5>{ STRINGS.shareClasses['transferRestriction'] }</h5>
                        { transferRestriction ? STRINGS.shareRegister.hasTransferRestriction : STRINGS.shareRegister.hasNoTransferRestriction }

                        { transferRestriction && <h5>{ STRINGS.shareClasses['transferRestrictionDocument']} </h5>  }
                        { transferRestriction &&  properties.transferRestrictionDocument }

                    </div>
                </div>
                { this.renderTable(k) }
            </div>
    }

    renderCurrentShareholdingsForClass(k) {
        const {shareRegister, shareClassMap, companyState} = this.props;
        const holdings = [...companyState.holdingList.holdings.filter(h => h.parcels.some(p => p.shareClass === k))];
        holdings.sort((a, b) => {
            return b.parcels.filter(p => p.shareClass === k)[0].amount - a.parcels.filter(p => p.shareClass === k)[0].amount
        })
        return <div >
                <h4>{ renderShareClass(k, shareClassMap) }</h4>
                    { holdings.map((holding, j) => {
                    const holders = [...holding.holders];
                    holders.sort((a, b) => {
                        return ((a.data||{}).votingShareholder && -1) || ((b.data||{}).votingShareholder && 1) || a.person.name.localeCompare(b.person.name)
                    });
                    return <table key={j} className="table share-register">
                                <thead>
                                <tr><th>{holding.name || `Shareholding #${j+1}`}</th><th>{ STRINGS.shareRegister['amount']}</th></tr>
                             </thead>
                        <tbody>
                            <tr>
                            <td>{ holders.map((h, i) => <div key={i}>
                                              {h.person.name}
                                              { ((h.data||{}).votingShareholder && holding.holders.length > 1) && <strong> (Voting Shareholder) </strong>}
                                              { (h.data||{}).heldPersonally === false && <span> ({h.data.onBehalfType} of {h.data.onBehalfDescription}) </span> }
                                              </div>) }</td>
                                <td className="share-register-amount">{ numberWithCommas(holding.parcels.filter(p => p.shareClass === k)[0].amount) }</td>
                            </tr>
                        </tbody>
                    </table>
                }) }
            </div>
    }

    renderTable(k) {
        const {shareRegister, shareClassMap, companyState} = this.props;
        const rows = shareRegister.filter(s => s.shareClass === k);
        if(!rows.length) {
            return false;
        }
        return <table className="table share-register">
            <thead>
                <tr>{ this.shareholderFields.map((f, i) => {
                    return <th key={i}>{STRINGS.shareRegister[f]}</th>
                })}</tr>
            </thead>
            <tbody>
                { rows.map((row, i) => {
                    return <tr key={i}>{ this.shareholderFields.map((f, j) => {
                        return <td key={j} className={"share-register-"+f}>{renderField(f, row[f], row, shareClassMap)}</td>
                    })}</tr>
                }) }
                <tr>
                    <td colSpan={2}><strong>Total { renderShareClass(k, shareClassMap) } Shares on Issue </strong></td>
                    <td className="share-register-amount"><strong>{ numberWithCommas((companyState.shareCountByClass[k] || {amount: 0}).amount) }</strong></td>
                </tr>
            </tbody>
        </table>
    }

    renderShareClasses(shareClasses) {
        return <div>
            <h3>Shareholders by Share Class</h3>
                { shareClasses.map((k, i) => {
                    return !!this.props.shareRegister.filter(s => s.shareClass === k).length && <div key={i}>{ this.renderShareClassSection(k) }</div>
                }) }

            </div>
    }


    renderCurrentShareholdings(shareClasses) {
        return <div>
            <h3>Current Shareholdings</h3>
                { shareClasses.map((k, i) => {
                    return !!this.props.shareRegister.filter(s => s.shareClass === k).length && <div key={i}>{ this.renderCurrentShareholdingsForClass(k) }</div>
                }) }
            </div>
    }

    renderHistory() {
        const {shareRegister, shareClassMap} = this.props;
        return <div>
            <h3>Transaction History</h3>
            { shareRegister.map((s, i) => {
                let title = s.name;


                if((s.holderData||{}).heldPersonally === false){
                    title += ` (${s.holderData.onBehalfType} of ${s.holderData.onBehalfDescription})`
                }

                if(s.holdingName){
                    title += ` (${s.holdingName})`
                }
                else if(!s.current){
                    title += ' (Historic Shareholding)';
                }

                title+= ` - ${renderShareClass(s.shareClass, shareClassMap)} Shares`;
                return <table key={i} className="table share-register transaction-history">
                        <thead>
                            <tr><th colSpan="2">{ title }</th><th className="total">Total</th></tr>
                        </thead>
                        <tbody>
                            { transactionRows(s, shareClassMap) }
                        </tbody>
                    </table>

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
            <div>From Date { stringDateToFormattedString(shareRegister[0].startDate) } to { stringDateToFormattedString(shareRegister[0].endDate) }</div>
            { this.renderCurrentShareholdings(shareClasses) }
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
        data: PropTypes.object.isRequired
    };
    render() {
        const shareRegister = (this.props.data || {}).shareRegister;
        if(!shareRegister){
            return false;
        }
        const companyState = ((this.props['/company/'+this.props.params.id +'/get_info'] || {}).data || {}).currentCompanyState;
        const shareClassMap = generateShareClassMap(companyState)

        if(!companyState){
            return false;
        }
        return <ShareRegisterDocument shareRegister={shareRegister} shareClassMap={shareClassMap} companyState={companyState}/>
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
        if(this.props.menu.view === 'document'){
            return <LawBrowserContainer lawLinks={shareRegisterLawLinks()} >
                <Widget title="Share Register">
                        { this.renderWarnings() }
                        { this.renderControls() }
                        <ShareRegisterDocument shareRegister={shareRegister} shareClassMap={shareClassMap} companyState={this.props.companyState}/>
                </Widget>
            </LawBrowserContainer>
        }
        else if(this.props.menu.view === 'table'){
            return <ShareRegisterTable shareRegister={shareRegister} shareClassMap={shareClassMap} />
        }
    }


    renderControls() {
        return  <Download url={`/api/company/render/${this.props.companyId}/share_register`} />


    }

    renderWarnings() {
        return false;
        //return <CompanyAlertsBase companyState={this.props.companyState} companyId={this.props.companyId} showTypes={['danger']}/>

    }

    render() {
        return <div>

            { this.renderShareRegister() }
        </div>
    }
}



