"use strict";
import React from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { personList } from '../../utils';
import { showTransactionView, requestResource } from '../../actions';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';


@connect(undefined, (dispatch, ownProps) => ({
    selectPerson: (person) => dispatch(showTransactionView('updatePerson', {...ownProps.transactionViewData, person}))
}))
export class SelectPersonTransactionView extends React.Component {
    constructor(props) {
        super(props);
        this.handleClose = ::this.handleClose;
    }

    handleClose() {
        this.props.end();
    }

    renderBody() {
        const persons = personList(this.props.transactionViewData.companyState)
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
            { persons.map((p, i) => {
                return <div className="holding well actionable" key={i} onClick={() => this.props.selectPerson(p) }>
                            <dl className="dl-horizontal">
                                <dt>Name</dt>
                                <dd>{ p.name}</dd>
                                <dt>Address</dt>
                                <dd><span className="address">{ p.address}</span></dd>
                            </dl>
                        </div>
                }) }
            </div>
            </div>
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Select Shareholder</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                {this.renderBody() }
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
              </TransactionView.Footer>
            </TransactionView>
    }
}



@connect((state, ownProps) => {
    return {
        historicHolders: state.resources['/company/'+ownProps.transactionViewData.companyId +'/historic_holders']
    }
}, (dispatch, ownProps) => ({
    requestData: () => dispatch(requestResource(`/company/${ownProps.transactionViewData.companyId}/historic_holders`)),
    selectPerson: (person) => dispatch(showTransactionView('updateHistoricPerson', {...ownProps.transactionViewData, person}))
    })
)
export class SelectHistoricPersonTransactionView extends React.Component {
    constructor(props) {
        super(props);
        this.handleClose = ::this.handleClose;
    }

    handleClose() {
        this.props.end();
    }

    fetch() {
        return this.props.requestData();
    };

    componentDidMount() {
        this.fetch();
    };

    componentDidUpdate() {
        this.fetch();
    };

    renderBody() {
        const persons = this.props.historicHolders;
        if(!persons || !persons.data){
             return <div className="loading"> <Glyphicon glyph="refresh" className="spin"/></div>
        }
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
            { persons.data.map((p, i) => {
                return <div className="holding well actionable" key={i} onClick={() => this.props.selectPerson(p) }>
                            <dl className="dl-horizontal">
                                <dt>Name</dt>
                                <dd>{ p.name}</dd>
                                <dt>Address</dt>
                                <dd><span className="address">{ p.address}</span></dd>
                            </dl>
                        </div>
                }) }
            </div>
            </div>
    }


    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Select Historic Shareholder</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                {this.renderBody() }
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
              </TransactionView.Footer>
            </TransactionView>
    }

}