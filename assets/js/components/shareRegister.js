"use strict";
import React, {PropTypes} from 'react';
import { requestResource } from '../actions';
import { pureRender, numberWithCommas } from '../utils';
import { connect } from 'react-redux';
import STRINGS from '../strings';
import LawBrowserLink from './lawBrowserLink'

function renderShareClass(shareClass){
    return shareClass || STRINGS.defaultShareClass
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
    return  JSON.stringify(action)
}


class RenderActions extends React.Component {

    renderAction(action) {
        switch(action.type){
            case 'ISSUE_TO':
                return renderIssue(action);
            case 'TRANSFER_TO':
                return renderTransferTo(action);
            case 'TRANSFER_FROM':
                return renderTransferFrom(action);
            case 'PURCHASE_FROM':
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
    fields = ['shareClass', 'name', 'address', 'holdingName', 'current', 'amount', 'sum', 'restrictions', 'issueHistory', 'repurchaseHistory', 'transferHistoryFrom', 'transferHistoryTo'];
    wideFields = {'name': 1, 'address': 1, 'issueHistory': 1, 'repurchaseHistory': 1, 'transferHistoryFrom': 1, 'transferHistoryTo': 1};

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

    renderField(key, data) {
        if(Array.isArray(data)){
            return  <RenderActions actions={data}/>
        }
        switch(key){
            case 'shareClass':
                return renderShareClass(data);
            case 'current':
                return data ? 'Yes': 'No';
            case 'amount':
            case 'sum':
                return numberWithCommas(data);
            default:
                return data;
        }
    }

    renderTable(shareRegister) {
        return <table className="table share-register">
            <thead>
                <tr>{ this.fields.map((f, i) => {
                    return <th className={this.wideFields[f] ? 'wide' : null } key={i}>{STRINGS.shareRegister[f]}</th>
                })}</tr>
            </thead>
            <tbody>
                { shareRegister.map((s, i) => {
                    return <tr key={i}>{ this.fields.map((f, j) => {
                        return <td key={j}>{this.renderField(f, shareRegister[i][f])}</td>
                    })}</tr>
                }) }
            </tbody>
        </table>
    }

    render() {
        const shareRegister = (this.props.data || {}).shareRegister;
        if(!shareRegister){
            return <div className="loading"></div>
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
                            {this.renderTable(shareRegister)}
                            </div>
                    </div>
                </div>
    }
}
