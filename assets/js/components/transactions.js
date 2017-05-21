"use strict";
import React, {PropTypes} from 'react';
import { requestResource, changeCompanyTab, toggleWidget } from '../actions';
import { pureRender, numberWithCommas, stringDateToFormattedString } from '../utils';
import { connect } from 'react-redux';
import ButtonInput from './forms/buttonInput';
import { Link } from 'react-router';
import Panel from './panel';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import STRINGS from '../strings';
import { push } from 'react-router-redux'
import Widget from './widget';
import LawBrowserContainer from './lawBrowserContainer';

function subTransactionCounts(subTransactions){
    if(!subTransactions || !subTransactions.length){
        return [];
    }
    const counts = subTransactions.reduce((acc, sub) => {
        const str = STRINGS.transactionTypes[sub.type];
        acc[str] = acc[str] || 0;
        acc[str]++;
        return acc;
    }, {});
    return Object.keys(counts).map((c, i) => {
        return <div key={i}>{ `${c} ×${counts[c]}` } </div>;
    });
}

class TransactionsTable extends React.Component {
    rowsRowSpan(transactions) {
        const rows = [];
        transactions.map((t, i) => {
            const rowSpan = (t.transaction.subTransactions ? t.transaction.subTransactions.length : 0) + 1;
            rows.push(<tr key={i} onClick={() => this.props.show(t.transaction.id)}>
                <td rowSpan={rowSpan}>{ t.transaction.id }</td>
                <td rowSpan={rowSpan}>{ stringDateToFormattedString(t.transaction.effectiveDate) }</td>
                <td rowSpan={rowSpan}>{ STRINGS.transactionTypes[t.transaction.type] }</td>
                { !t.transaction.subTransactions && <td></td> }
            </tr>);
            (t.transaction.subTransactions || []).map((t, j) => {
                rows.push(<tr key={i+'-'+j} onClick={() => this.props.show(t.id)}><td>{STRINGS.transactionTypes[t.type]}</td></tr>)
            });

        });
        return rows;
    }

    rows(transactions) {
        const rows = [];
        transactions.map((t, i) => {
            rows.push(<tr key={i} onClick={() => this.props.show(t.transaction.id)}>
                <td>{ t.transaction.id }</td>
                <td>{ stringDateToFormattedString(t.transaction.effectiveDate) }</td>
                <td>{ STRINGS.transactionTypes[t.transaction.type] }</td>
                <td>{ subTransactionCounts(t.transaction.subTransactions) } </td>
            </tr>);


        });
        return rows;
    }
    render() {
        const transactions = (this.props.data || {}).transactions;
        if(!transactions){
            return <div className="loading"></div>
        }
        return <table className="table table-hover">
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
    }
}


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

    show(transactionId) {
        this.props.dispatch(push(`${this.props.baseUrl}/transactions/${transactionId}`));
    }

    renderChildren() {
        return React.cloneElement(this.props.children, {
            ...this.props,
            transactions: ((this.props.data || {}).transactions || []).map(t => t.transaction)
        });
    }

    render() {
        return <LawBrowserContainer>
            <Widget title="Transactions" iconClass="fa fa-balance-scale">
                 { this.props.children ? this.renderChildren() : <TransactionsTable {...this.props}  show={(id) => this.show(id)} /> }
            </Widget>
        </LawBrowserContainer>
    }
}


@connect(undefined, {
    showTransaction: (companyId, id) => push(`/company/view/${companyId}/upcoming_transactions/${id}`)
})
export class PendingTransactions extends React.Component {

    show(transactionId) {
        this.props.showTransaction(this.props.companyId, transactionId);
    }

    renderChildren() {
        return React.cloneElement(this.props.children, {
            ...this.props,
            transactions:  this.props.companyState.futureTransactions
        });
    }

    render() {
        return  <LawBrowserContainer>
            <Widget title="Upcoming Transactions" iconClass="fa fa-hourglass-end">
                    { this.props.children ? this.renderChildren() : <TransactionsTable
                        {...this.props}
                        data={{transactions: ((this.props.companyState || {}).futureTransactions || []).map(t => ({transaction: t}))}}
                        show={(id) => this.show(id)} /> }
            </Widget>
        </LawBrowserContainer>
    }
}


export class TransactionWidget extends React.Component {
    static propTypes = {
        companyState: PropTypes.object.isRequired,
        companyId: PropTypes.string.isRequired,
    };
    renderBody() {

        const transactions = (this.props.companyState.transactions || []).filter(t => t);
        return  <div  onClick={() => this.props.toggle(!this.props.expanded)}>
                <table className="table table-condensed" style={{marginBottom: 0}}>
                <thead><tr><th>Type</th><th>Date</th></tr></thead>
                <tbody>
                { (transactions).map((d, i) => {
                    return <tr key={i}><td>{STRINGS.transactionTypes[d.type]}</td><td>{stringDateToFormattedString(d.effectiveDate)}</td></tr>
                }) }
                </tbody>
                </table>
        </div>
    }

    render(){
        let bodyClass = "expandable ";
        if(this.props.expanded){
            bodyClass += "expanded ";
        }
        return  <Widget className=" company-transactions" title="Completed Transactions" iconClass="fa fa-balance-scale" link={`${this.props.baseUrl}/transactions`} bodyClass={bodyClass}>
                   { this.renderBody() }
            </Widget>
    }
}




export class PendingTransactionsWidget extends React.Component {
    static propTypes = {
        companyState: PropTypes.object.isRequired,
        companyId: PropTypes.string.isRequired,
    };
    renderBody() {


        const transactions = (this.props.companyState.futureTransactions || []).filter(t => t);
        if(!transactions.length){
            return <span>No Upcoming Transactions</span>
        }
        return  <div  onClick={() => this.props.toggle(!this.props.expanded)}>
                <table className="table table-condensed" style={{marginBottom: 0}}>
                <thead><tr><th>Type</th><th>Date</th></tr></thead>
                <tbody>
                { (transactions).map((d, i) => {
                    return <tr key={i}><td>{STRINGS.transactionTypes[d.type]}</td><td>{stringDateToFormattedString(d.effectiveDate)}</td></tr>
                }) }
                </tbody>
                </table>
        </div>
    }

    render(){
        let bodyClass = "expandable ";
        if(this.props.expanded){
            bodyClass += "expanded ";
        }
        return  <Widget title="Upcoming Transactions" iconClass="fa fa-hourglass-end" link={`${this.props.baseUrl}/upcoming_transactions`} bodyClass={bodyClass}>
                   { this.renderBody() }
            </Widget>

    }
}

