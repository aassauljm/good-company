"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from '../forms/buttonInput';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { formFieldProps, requireFields, joinAnd, personList } from '../../utils';
import { showTransactionView } from '../../actions';
import STRINGS from '../../strings';
import { Director } from '../directors';
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

export function RemoveDirectorLawLinks(){
    return <div>
            <LawBrowserLink title="Companies Act 1993" location="s 126" >Meaning of director</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 156" >Removal of directors</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 157(1)" >Vacation in office of director</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 157(2)" >Resignation of director</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 157(3)" >Liability of former directors</LawBrowserLink>
            <LawBrowserLink title="Companies Act 1993" location="s 159" >Notice of change of directors</LawBrowserLink>
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
                    return <Director key={i} director={p} editDirector={() => this.props.dispatch(showTransactionView(this.props.selectAction, {...this.props.transactionViewData, director: p}))}/>
                    }) }
            </div>
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'} lawLinks={this.props.lawLinks}>
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


export const SelectDirectorRemoveTransactionView = (props) => {
    return <SelectDirectorTransactionView selectAction='removeDirector' {...props} lawLinks={RemoveDirectorLawLinks()}/>
}


export const SelectDirectorUpdateTransactionView = (props) => {
    return <SelectDirectorTransactionView selectAction='updateDirector' {...props} lawLinks={DirectorLawLinks()}/>
}