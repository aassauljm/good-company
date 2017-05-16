"use strict";
import React from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { personList } from '../../utils';
import { showTransactionView, requestResource } from '../../actions';
import { isNaturalPerson } from '../../utils';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { ShareholderLawLinks } from './updatePerson';



export function Holder(props) {
    const icon = isNaturalPerson(props.person) ? 'fa-user-circle' : 'fa-university';
    let className= 'holding well ';
    if(props.selectPerson){
        className += 'actionable '
    }
    return <div className={className} onClick={() => props.selectPerson && props.selectPerson(props.person) }>
         <i className={`fa well-icon ${icon}`} />
                <dl className="dl-horizontal">
                    <dt>Name</dt>
                    <dd>{ props.person.name}</dd>
                    <dt>Address</dt>
                    <dd><span className="address">{ props.person.address}</span></dd>
                    { props.person.companyNumber && <dt>Company #</dt> }
                    { props.person.companyNumber && <dd>{ props.person.companyNumber}</dd> }
                    { props.children }
                </dl>
            </div>
}


@connect(undefined, (dispatch, ownProps) => ({
    selectPerson: (person) => dispatch(showTransactionView('updatePerson', {...ownProps.transactionViewData, person}))
}))
export class SelectPersonTransactionView extends React.PureComponent {
    constructor(props) {
        super(props);
        this.handleClose = ::this.handleClose;
    }

    handleClose() {
        this.props.end();
    }

    renderBody() {
        const persons = personList(this.props.transactionViewData.companyState)
        return <div >
            { persons.map((p, i) => <Holder key={i} person={p} selectPerson={this.props.selectPerson} />) }
        </div>
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'} lawLinks={ShareholderLawLinks()}>
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
        return <div >
            { persons.data.map((p, i) => <Holder key={i} person={p} selectPerson={this.props.selectPerson} />) }
        </div>
    }


    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'} lawLinks={ShareholderLawLinks()}>
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