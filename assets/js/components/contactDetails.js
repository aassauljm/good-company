"use strict";
import React, { PropTypes } from 'react';
import { Link } from 'react-router'
import STRINGS from '../strings'
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { pureRender } from '../utils';
import { companyTransaction, addNotification } from '../actions';
import { ContactFormConnected, contactDetailsFormatSubmit, immutableFields, defaultCustomFields } from './forms/contactDetails';
import { replace } from 'react-router-redux'
import LawBrowserContainer from './lawBrowserContainer'
import LawBrowserLink from './lawBrowserLink'


export function contactLawLinks(){
    return <div>
    <LawBrowserLink title="Companies Act 1993" location="s 186">Requirement to have registered office</LawBrowserLink>
    <LawBrowserLink title="Companies Act 1993" location="s 187">Change of registered office by board</LawBrowserLink>
    <LawBrowserLink title="Companies Act 1993" location="s 188">Requirement tocange registered office</LawBrowserLink>
    <LawBrowserLink title="Companies Act 1993" location="s 189">Records kept at registered Offie</LawBrowserLink>
    <LawBrowserLink title="Companies Act 1993" location="s 192">Requirement to have address for Sservice</LawBrowserLink>
    <LawBrowserLink title="Companies Act 1993" location="s 193">Change of address for service by board </LawBrowserLink>
    <LawBrowserLink title="Companies Act 1993" location="s 193A">Rectification or correction of address for service</LawBrowserLink>
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
                    Contact
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
    refresh: (location) => replace(location)
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
                            />
                    </div>
                </div>
            </LawBrowserContainer>

    }
}