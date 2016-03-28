"use strict";
import React, {PropTypes} from 'react';
import { requestResource } from '../actions';
import { pureRender, numberWithCommas } from '../utils';
import { connect } from 'react-redux';
import STRINGS from '../strings';
import LawBrowserLink from './lawBrowserLink'
import { renderRights, renderLimitations } from './shareClasses';


function renderShareClass(shareClass, shareClassMap = {}){
    return shareClassMap[shareClass] ? shareClassMap[shareClass].name : STRINGS.defaultShareClass
}

// all the same
function renderIssue(action){
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

function renderPurchaseFrom(action){
    const date = new Date(action.effectiveDate).toDateString();
    return  `${numberWithCommas(action.data.amount)} ${renderShareClass(action.data.shareClass)} on ${date}`
}


class RenderActions extends React.Component {

    renderAction(action) {
        switch(action.type){
            case 'ISSUE_TO':
            case 'SUBVISION_TO':
            case 'CONVERSION_TO':
                return renderIssue(action);
            case 'TRANSFER_TO':
                return renderTransferTo(action);
            case 'TRANSFER_FROM':
                return renderTransferFrom(action);
            case 'PURCHASE_FROM':
            case 'REDEMPTION_FROM':
            case 'ACQUISITION_FROM':
            case 'CONSOLIDATION_FROM':
                return renderPurchaseFrom(action);
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

    static defaultShareMap = {};

    fields = ['shareClass', 'name', 'address', 'holdingName', 'current', 'amount', 'sum', 'votingRights', 'limitations', 'issueHistory', 'repurchaseHistory', 'transferHistoryFrom', 'transferHistoryTo'];
    wideFields = {'name': 1, 'address': 1, 'votingRights': 1, 'limitations': 1, 'issueHistory': 1, 'repurchaseHistory': 1, 'transferHistoryFrom': 1, 'transferHistoryTo': 1};

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

    renderField(key, data, row, shareClassMap) {
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

    renderTable(shareRegister, shareClassMap) {
        return <table className="table share-register">
            <thead>
                <tr>{ this.fields.map((f, i) => {
                    return <th className={this.wideFields[f] ? 'wide' : null } key={i}>{STRINGS.shareRegister[f]}</th>
                })}</tr>
            </thead>
            <tbody>
                { shareRegister.map((s, i) => {
                    return <tr key={i}>{ this.fields.map((f, j) => {
                        return <td key={j}>{this.renderField(f, shareRegister[i][f], shareRegister[i], shareClassMap)}</td>
                    })}</tr>
                }) }
            </tbody>
        </table>
    }

    render() {
        const shareRegister = (this.props.data || {}).shareRegister;
        let shareClassMap = ShareRegister.defaultShareMap;
        if(!shareRegister){
            return <div className="loading"></div>
        }
        if(this.props.companyState.shareClasses && this.props.companyState.shareClasses.shareClasses){
            shareClassMap = this.props.companyState.shareClasses.shareClasses.reduce((acc, s) => {
                acc[s.id] = s;
                return acc;
            }, {});
        }
        return <div>
                    <div className="container">
                        <div className="well">
                            <h3>Share Register</h3>
                            <LawBrowserLink title="Companies Act 1993" location="s 87">s 87 of the Companies Act 1993</LawBrowserLink>
                        </div>
                    </div>
                    <div className="container-fluid">
                        <div className="table-responsive">
                            {this.renderTable(shareRegister, shareClassMap)}
                            </div>
                    </div>
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

