"use strict";
import React, {PropTypes} from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from '../forms/input';
import STRINGS from '../../strings'
import { numberWithCommas } from '../../utils'
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { fieldStyle, fieldHelp } from '../../utils';
import { Link } from 'react-router';
import { companyTransaction, addNotification } from '../../actions';


function renderHolders(holding){
    return <ul>
        { holding.holders.map((h, i) => {
            return <li key={i}>{ h.person.name } </li>
        })}
    </ul>
}

function renderAmount(holding){
    return <ul>
        { holding.parcels.map((h, i) => {
            return <li key={i}>{ numberWithCommas(h.amount) } </li>
        })}
    </ul>
}



export class Subdivide extends React.Component {
    static propTypes = {
        options: PropTypes.array.isRequired,
    };
    renderSelect(shareClass) {
        return <Input type="select" {...shareClass} bsStyle={fieldStyle(shareClass)} help={fieldHelp(shareClass)}
            hasFeedback >
                <option></option>
                { this.props.options }
            </Input>
    }

    render() {
        return
    }
}



@connect(undefined)
export class SubdivisionTransactionView extends React.Component {
    constructor(props) {
        super(props);
         this.submit = ::this.submit;
    }

    handleNext() {
       // this.refs.form.submit();
       this.submit();
    }

    submit(values) {
        this.props.end({reload: true});
        const holdings = [];
        Object.keys(values).map(k => {
            if(!values[k]) return;
            holdings.push({
                holdingId: parseInt(k, 10),
                shareClass: parseInt(values[k], 10),
                transactionType: 'SUBDIVISION'
            });
        });
        this.props.dispatch(companyTransaction('compound',
                                this.props.transactionViewData.companyId,
                                {actions: holdings}))
            .then(() => {
                this.props.end({reload: true});
                this.props.dispatch(addNotification({message: 'Share subdivided.'}));
                const key = this.props.transactionViewData.companyId;
            })
            .catch((err) => {
                this.props.dispatch(addNotification({message: err.message, error: true}));
            });
    }

    renderBody(companyState) {
        const shareClasses = ((companyState.shareClasses || {}).shareClasses || []);

        const options = shareClasses.map((s, i) => {
            return <option key={i} value={s.id}>{s.name}</option>
        })
        return <table className="table table-striped">
            <thead>
            <tr><th>Name</th><th>Shareholders</th><th>Shares</th><th>Share Class</th></tr>
            </thead>
            <tbody>
                { companyState.holdingList.holdings.map((h, i) => {
                    return <tr key={i}>
                        <td>{ h.name }</td>
                        <td>{ renderHolders(h) }</td>
                        <td>{ renderAmount(h) }</td>
                        <td></td>
                    </tr>
                })}
            </tbody>
        </table>
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Subdivide Shares</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
               THIS FUNCTIONALITY IS UNDER DEVELOPMENT
                { this.renderBody(this.props.transactionViewData.companyState) }
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={this.props.end} >Close</Button>
                 <Button onClick={::this.handleNext} bsStyle="primary">{ 'Submit' }</Button>
              </TransactionView.Footer>
            </TransactionView>
    }
}