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
import LawBrowserLink from '../lawBrowserLink';

export function DirectorLawLinks(){
    return <div>
            <LawBrowserLink title="Companies Act 1993" location="s 150" >Number of directors</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 151" >Qualifications of directors</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 152" >Director's consent to appointment</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 153(1)" >Appointment of first directors</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 153(2)" >Appointment of subsequent directors</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 154" >Court appointment of directors</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 155" >Voting on the appointment of directors</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 159" >Notice of the change of directors</LawBrowserLink>
        </div>

}


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
        return <div >
                { directors.map((p, i) => {
                    return <Director key={i} director={p} editDirector={() => this.props.dispatch(showTransactionView('updateDirector', {...this.props.transactionViewData, director: p}))}/>
                    }) }
            <div className="button-row"><ButtonInput bsStyle={'primary'} onClick={(e) => {
                    this.props.dispatch(showTransactionView('updateDirector', {...this.props.transactionViewData, director: null}))
                }}>Appoint Director</ButtonInput></div>
            </div>
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'} lawLinks={DirectorLawLinks()}>
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