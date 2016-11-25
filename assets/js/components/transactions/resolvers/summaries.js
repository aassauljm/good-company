"use strict";
import React, { PropTypes } from 'react';
import { pureRender, stringDateToFormattedString, stringDateToFormattedStringTime,  renderShareClass, joinAnd, numberWithCommas } from '../../../utils';
import STRINGS from '../../../strings'
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { Link } from 'react-router'

export function actionAmountDirection(action){
    return action.afterAmount >= action.beforeAmount || !action.beforeHolders;
}

export function companiesOfficeDocumentUrl(companyState, documentId){
    const companyNumber = companyState.companyNumber;
    return `http://www.business.govt.nz/companies/app/ui/pages/companies/${companyNumber}/${documentId}/entityFilingRequirement`;
}


export function sourceInfo(companyState, actionSet){
    return <div className="summary outline no-border">
        <div className="outline-header">
            <div className="outline-title">Source Information</div>
        </div>
            <div className="row">
            <div className="col-md-6 summary-label">Registration Date & Time</div>
            <div className="col-md-6">{stringDateToFormattedStringTime(actionSet.data.date)}</div>
        </div>
        <div className="row">
            <div className="col-md-6 summary-label">Source Document</div>
            <div className="col-md-6"><Link target="_blank" rel="noopener noreferrer" className="external-link" to={companiesOfficeDocumentUrl(companyState, actionSet.data.documentId)}>Companies Office <Glyphicon glyph="new-window"/></Link></div>
        </div>
    </div>

}

export function basicSummary(context, companyState){
    const { action, actionSet } = context;
    return <div>
            <div className="row">
                <div className="col-md-6 col-md-offset-3">
                    { sourceInfo(companyState, actionSet) }
                </div>
            </div>
        </div>
}


export function addressChange(context) {
    /// if(!AddressService.compareAddresses(newAddress, companyState[data.field])){
    /// ['registeredCompanyAddress',
    ///  'addressForShareRegister',
    ///  'addressForService']
    return <div className="row row-separated">
                <div className="col-md-5">
                <h5>Previous {STRINGS[context.action.field]}</h5>
                { context.action.previousAddress }
            </div>
            <div className="col-md-2">
                <div className="text-center">
                    <Glyphicon glyph="arrow-right" className="big-arrow" />
                    <h5>Effective as at {stringDateToFormattedStringTime(context.action.effectiveDate)}</h5>
                </div>
            </div>
            <div className="col-md-5">
                <h5>New {STRINGS[context.action.field]}</h5>
                { context.action.newAddress }
            </div>
        </div>
}


export function holderChange(context) {
    return <div className="row row-separated">
                <div className="col-md-5">
                <h5>Previous Shareholder</h5>
                <div className="shareholding action-description">
                { renderHolders(context.action.beforeHolder) }
                </div>
            </div>
            <div className="col-md-2">
                <div className="text-center">
                    <Glyphicon glyph="arrow-right" className="big-arrow" />
                    <h5>Effective as at {stringDateToFormattedStringTime(context.action.effectiveDate)}</h5>
                </div>
            </div>
            <div className="col-md-5">
                <h5>Updated Shareholder</h5>
                <div className="shareholding action-description">
                { renderHolders(context.action.afterHolder) }
                </div>
            </div>
        </div>
}



export function beforeAndAfterSummary(context, companyState){
    const { action, actionSet } = context;
    const increase = actionAmountDirection(action);
    const beforeCount = action.beforeAmount || 0;
    const afterCount = action.beforeHolders ? action.afterAmount : action.amount;

    const beforeShares = beforeCount ? `${numberWithCommas(beforeCount)} ${renderShareClass(action.shareClass, context.shareClassMap)} Shares` : 'No Shares';
    const afterShares = afterCount ? `${numberWithCommas(afterCount)} ${renderShareClass(action.shareClass, context.shareClassMap)} Shares` : 'No Shares';
    //const afterShares = `${action.beforeHolders ? action.afterAmount : action.amount} ${renderShareClass(action.shareClass, context.shareClassMap)} Shares`;
    return <div className="row row-separated">
                <div className="col-md-5">
                    <div className="shareholding action-description ">
                     <div className="shares">{  beforeShares }</div>
                        { (action.beforeHolders || action.holders).map(renderHolders) }
                    </div>

                </div>
                <div className="col-md-2">
                    <div className="text-center">
                        <Glyphicon glyph="arrow-right" className="big-arrow" />
                        <p><span className="shares">{ numberWithCommas(action.amount) } { renderShareClass(action.shareClass, context.shareClassMap)} Shares { increase ? 'added' : 'removed'}</span></p>
                    </div>
                </div>
                <div className="col-md-5">
                    <div className="shareholding action-description ">
                         <div className="shares">{ afterShares }</div>
                        { (action.afterHolders || action.holders).map(renderHolders) }
                    </div>
                </div>
            </div>
}

export function holdingChangeSummary(context, companyState, showType){
    const { action, actionSet } = context;

    return <div>
            { showType && <div className="row">
                <div className="col-md-12">
                    <div className="text-center">
                    <h5>{ STRINGS.transactionTypes[action.transactionType] }</h5>
                    </div>
                </div>
            </div> }
            <div className="row">
                <div className="col-md-5">
                    <div className="shareholding action-description ">
                    { action.beforeHolders.map(renderHolders) }
                    </div>
                </div>
                <div className="col-md-2">
                    <div className="text-center">
                        <Glyphicon glyph="arrow-right" className="big-arrow" />
                    </div>
                </div>
                <div className="col-md-5">
                    <div className="shareholding action-description ">
                    { action.afterHolders.map(renderHolders) }
                    </div>
                </div>
            </div>
    </div>
}

export function renderHolders(h, i){
    return <div key={i}>
        <div className="name">{ h.name }{h.companyNumber && ` (${h.companyNumber})`}</div>
        <div className="address">{ h.address }</div>
    </div>
}
