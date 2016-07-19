"use strict";
import React, {PropTypes} from 'react';
import { requestResource, changeCompanyTab, toggleWidget } from '../actions';
import { pureRender, numberWithCommas, stringToDate } from '../utils';
import { connect } from 'react-redux';
import ButtonInput from './forms/buttonInput';
import { Link } from 'react-router';
import Panel from './panel';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import STRINGS from '../strings';
import { push } from 'react-router-redux'



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
        this.props.dispatch(push(`/company/view/${this.props.companyId}/transactions/${transactionId}`));
    }

    rows(transactions) {
        const rows = [];
        transactions.map((t, i) => {
            const rowSpan = (t.transaction.subTransactions ? t.transaction.subTransactions.length : 0) + 1;
            rows.push(<tr key={i} onClick={() => this.show(t.transaction.transactionId)}>
                <td rowSpan={rowSpan}>{ t.transaction.transactionId }</td>
                <td rowSpan={rowSpan}>{ stringToDate(t.transaction.effectiveDate) }</td>
                <td rowSpan={rowSpan}>{ STRINGS.transactionTypes[t.transaction.type] }</td>
                { !t.transaction.subTransactions && <td></td> }
            </tr>);
            (t.transaction.subTransactions || []).map((t, j) => {
                rows.push(<tr key={i+'-'+j} onClick={() => this.show(t.id)}><td>{STRINGS.transactionTypes[t.type]}</td></tr>)
            });

        });
        return rows;
    }

    renderTable() {
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

    renderChildren() {
        return React.cloneElement(this.props.children, {
            ...this.props,
            transactions: ((this.props.data || {}).transactions || []).map(t => t.transaction)
        });
    }

    render() {
        return <div className="container">
            <div className="row">
            <div className="widget">
                <div className="widget-header">
                    <div className="widget-title">
                        Transactions
                    </div>
                </div>
                <div className="widget-body">
                    { this.props.children ? this.renderChildren() : this.renderTable() }
                </div>
            </div>
            </div>
        </div>
    }
}

export class TransactionWidget extends React.Component {
    static propTypes = {
        companyState: PropTypes.object.isRequired,
        companyId: PropTypes.string.isRequired,
    };
    renderBody() {
        let bodyClass = "widget-body expandable ";
        if(this.props.expanded){
            bodyClass += "expanded ";
        }

        const transactions = (this.props.companyState.transactions || []).filter(t => t);
        return  <div className="widget-body"  className={bodyClass} onClick={() => this.props.toggle(!this.props.expanded)}>
                <table className="table table-condensed" style={{marginBottom: 0}}>
                <thead><tr><th>Type</th><th>Date</th></tr></thead>
                <tbody>
                { (transactions).map((d, i) => {
                    return <tr key={i}><td>{STRINGS.transactionTypes[d.type]}</td><td>{stringToDate(d.effectiveDate)}</td></tr>
                }) }
                </tbody>
                </table>
        </div>
    }

    render(){
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    Transactions
                </div>
                <div className="widget-control">
                <Link to={`/company/view/${this.props.companyId}/transactions`} >View All</Link>
                </div>
            </div>

            { this.renderBody() }
        </div>
    }
}
