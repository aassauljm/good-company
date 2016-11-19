"use strict";
import React, {PropTypes} from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from '../forms/buttonInput';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { formFieldProps, requireFields, joinAnd, personList } from '../../utils';
import { showTransactionView } from '../../actions';
import STRINGS from '../../strings';
import { Director } from '../companyDetails';

@connect(undefined)
export class SelectDirectorTransactionView extends React.Component {
    constructor(props) {
        super(props);
        this.handleClose = ::this.handleClose;
    }

    handleClose(data={}) {
        this.props.end(data);
    }

    renderBody() {
        const directors = this.props.transactionViewData.companyState.directorList.directors;
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                { directors.map((p, i) => {
                    return <Director key={i} director={p} editDirector={() => this.props.dispatch(showTransactionView('updateDirector', {...this.props.transactionViewData, director: p}))}/>
                    }) }
            <div className="button-row"><ButtonInput onClick={(e) => {
                    this.props.dispatch(showTransactionView('updateDirector', {...this.props.transactionViewData, director: null}))
                }}>Add Director</ButtonInput></div>
            </div>
            </div>
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Select Director</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody() }
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
              </TransactionView.Footer>
            </TransactionView>
    }

}