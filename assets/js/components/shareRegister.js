"use strict";
import React, {PropTypes} from 'react';
import { requestResource } from '../actions';
import { pureRender, numberWithCommas } from '../utils';
import { connect } from 'react-redux';
import STRINGS from '../strings';
import LawBrowserLink from './lawBrowserLink'

function renderShareClass(shareClass){
    return shareClass || 'Ordinary'
}


function renderIssue(action){
    const date = new Date(action.effectiveDate).toDateString();
    return `${action.data.amount} ${renderShareClass(action.data.shareClass)} on ${date}`
}

function renderTransferTo(action){
    const date = new Date(action.effectiveDate).toDateString();
    return  `${action.data.amount} ${renderShareClass(action.data.shareClass)} on ${date}`
}

function renderTransferFrom(action){
    const date = new Date(action.effectiveDate).toDateString();
    return  `${action.data.afterAmount} ${renderShareClass(action.data.shareClass)} on ${date}`
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
    fields = ['shareClass', 'name', 'address', 'holdingName', 'current', 'amount', 'restrictions', 'issueHistory', 'repurchaseHistory', 'transferHistoryFrom', 'transferHistoryTo'];
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
                return data ? 'Yes': 'No'
            default:
                return data;
        }

    }

    renderTable(shareRegister) {
        return <table className="table table-responsive">
            <thead>
                <tr>{ this.fields.map((f, i) => {
                    return <th key={i}>{STRINGS.shareRegister[f]}</th>
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
                            {this.renderTable(shareRegister)}
                    </div>
                </div>
    }
}
