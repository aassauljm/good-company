"use strict";
import React, { PropTypes } from 'react';
import { Link } from 'react-router'
import STRINGS from '../strings'
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { pureRender } from '../utils';
import { companyTransaction, addNotification, showTransactionView } from '../actions';
import { ContactFormConnected, contactDetailsFormatSubmit, immutableFields, defaultCustomFields } from './forms/contactDetails';
import { replace, push } from 'react-router-redux'
import LawBrowserContainer from './lawBrowserContainer'
import LawBrowserLink from './lawBrowserLink'
import TransactionView from './forms/transactionView';

export function contactLawLinks(){
    return <div>
    <LawBrowserLink title="Companies Act 1993" location="s 186">Requirement to have registered office</LawBrowserLink>
    <LawBrowserLink title="Companies Act 1993" location="s 187">Change of registered office by board</LawBrowserLink>
    <LawBrowserLink title="Companies Act 1993" location="s 188">Requirement to change registered office</LawBrowserLink>
    <LawBrowserLink title="Companies Act 1993" location="s 189">Records kept at registered Offie</LawBrowserLink>
    <LawBrowserLink title="Companies Act 1993" location="s 192">Requirement to have address for service</LawBrowserLink>
    <LawBrowserLink title="Companies Act 1993" location="s 193">Change of address for service by board </LawBrowserLink>
    <LawBrowserLink title="Companies Act 1993" location="s 193A">Rectification or correction of address for service</LawBrowserLink>
    <LawBrowserLink title="Companies Act 1993" location="s 2(5)">Meaning of address</LawBrowserLink>
    <LawBrowserLink title="Companies Act 1993" location="s 387">Service of documents on companies in legal proceedings</LawBrowserLink>
    <LawBrowserLink title="Companies Act 1993" location="s 388">Service of other documents on companies</LawBrowserLink>
    <LawBrowserLink title="Companies Act 1993" location="s 392">Additional provisions relating to service</LawBrowserLink>
    </div>
}

export class ContactDetailsWidget extends React.Component {
    static propTypes = {
        companyState: PropTypes.object.isRequired,
        companyId: PropTypes.string.isRequired,
        toggle: PropTypes.func.isRequired,
        expanded: PropTypes.bool
    };
    key() {
        return this.props.companyId;
    }
    renderBody() {
        let bodyClass = "widget-body expandable ";
        if(this.props.expanded){
            bodyClass += "expanded ";
        }

        const data = this.props.companyState, contactFields = data.contactFields || [];
        return  <div className="widget-body"  className={bodyClass} onClick={() => this.props.toggle(!this.props.expanded)}>
            <div key="body" >
            <dl>
                { immutableFields.map((f, i) =>  <div key={i}><dt>{ STRINGS[f] }</dt><dd>{data[f] }</dd></div>) }
                { contactFields.map((f, i) => f.value && f.label && <div key={i}><dt>{ f.label }</dt><dd>{ f.value}</dd></div>) }
                </dl>
            </div>
        </div>
    }

    render() {
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    <span className="fa fa-envelope-o"/> Contact
                </div>
                <div className="widget-control">
                 <Link to={`/company/view/${this.key()}/contact`} >View All</Link>
                </div>
            </div>
            { this.renderBody() }
        </div>
    }
}


@connect(undefined, {
    submit: (type, id, values) => companyTransaction(type, id, values),
    addNotification: (args) => addNotification(args),
    refresh: (location) => replace(location),
    navigate: (url) => push(url),
    startTransaction: (key, companyState, companyId) => showTransactionView(key, {companyState: companyState, companyId: companyId})
})
export default class ContactDetails extends React.Component {
    static propTypes = {
        companyState: PropTypes.object.isRequired,
        companyId: PropTypes.string.isRequired
    };
    handleSubmit(values) {
        const transactions = contactDetailsFormatSubmit(values, this.props.companyState);
        if(!transactions[0].actions.length){
            return;
        }
        this.props.submit('compound',
                          this.props.companyId,
                          {transactions: transactions,
                            documents: values.documents})
            .then(() => {
                this.props.addNotification({message: 'Contact Details Updated'});
                this.props.refresh(this.props.location);
            })
            .catch((err) => {
                this.props.addNotification({message: err.message, error: true});
            })
    }

    handleSelectAddressChange(key) {
        const map = {
            addressForService: 'changeAddressForService',
            registeredCompanyAddress: 'changeRegisteredOffice'
        }
        if(!map[key]){
            return;
        }
        const id = this.props.companyId;
        this.props.navigate(`/company/view/${id}/new_transaction`);
        this.props.startTransaction(map[key], this.props.companyState, this.props.companyId);
    }

    render() {
        const data = this.props.companyState, contactFields = data.contactFields || defaultCustomFields.map(f => ({
            value: '',
            label: f
        }));

        return <LawBrowserContainer lawLinks={contactLawLinks()}>
                <div className="widget">
                    <div className="widget-header">
                        <div className="widget-title">
                            Contact
                        </div>
                    </div>
                    <div className="widget-body">
                            <ContactFormConnected
                                initialValues={{...data, contactFields : contactFields}}
                                onSubmit={::this.handleSubmit}
                                handleClickImmutable={::this.handleSelectAddressChange}
                                controls={true}
                            />
                    </div>
                </div>
            </LawBrowserContainer>

    }
}



@connect(undefined, {
    submit: (type, id, values) => companyTransaction(type, id, values),
    addNotification: (args) => addNotification(args)
})
export class ContactDetailsTransactionView extends React.Component {
    constructor(props) {
        super(props);
        this.handleClose = ::this.handleClose;
        this.handleSubmit = ::this.handleSubmit;
    }

    handleClose(data={}) {
        this.props.end(data);
    }


    handleSubmit(values) {
        const transactions = contactDetailsFormatSubmit(values, this.props.transactionViewData.companyState);
        if(!transactions[0].actions.length){
            return;
        }
        this.props.submit('compound',
                          this.props.transactionViewData.companyId,
                          {transactions: transactions,
                            documents: values.documents})
            .then(() => {
                this.props.addNotification({message: 'Contact Details Updated'});
                this.handleClose({reload: true})
            })
            .catch((err) => {
                this.props.addNotification({message: err.message, error: true});
            })
    }

    handleSelectAddressChange(key) {
        const map = {
            addressForService: 'changeAddressForService',
            registeredCompanyAddress: 'changeRegisteredOffice'
        }
        if(!map[key]){
            return;
        }
        const id = this.props.companyId;
        this.props.show(map[key]);
    }

    renderBody() {
        const data = this.props.transactionViewData.companyState, contactFields = data.contactFields || defaultCustomFields.map(f => ({
            value: '',
            label: f
        }));

       return <ContactFormConnected
                ref='form'
                initialValues={{...data, contactFields : contactFields}}
                onSubmit={::this.handleSubmit}
                handleClickImmutable={::this.handleSelectAddressChange}
                controls={false}
            />
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'} lawLinks={contactLawLinks()}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>{this.props.title}</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody() }
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
                <Button bsStyle="primary" onClick={() => this.refs.form.submit()}>Submit</Button>
              </TransactionView.Footer>
            </TransactionView>
    }
}