"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import { DecreaseTransactionView, createFormatSubmit } from './decreaseShares';
import LawBrowserLink from '../lawBrowserLink'


const formatSubmit = createFormatSubmit({baseTransaction: 'PURCHASE', fromTransaction: 'PURCHASE_FROM'})


function purchaseLawLinks() {
    return <div>
        <LawBrowserLink title="Companies Act 1993" location="s 58(1)">How a company may acquire its own shares</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 59(1)+(2)">Acquisition of company's shares under constitution</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 60">Board may make offer to acquire shares</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 61">Special offers to acquire shares</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 67">Contracts for the company to repurchase shares</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 63, 65">Stock exchange acquisitions</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 107(1)(c)">Entitled persons' agreement to acquire shares</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 51(1), 108">Company to satisfy solvency test</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 58(3)">Notice of acquisition of company's shares</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 58(4)">Failure to give notice of acquisition</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 52(1)-(4)">Process for authorising distributions</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 52(5),373(1)(4)">Failure to give director's certificate</LawBrowserLink>
        </div>
}


export class PurchaseTransactionView extends React.Component {

    render() {
        return <DecreaseTransactionView
            title="Purchase of Shares"
            formName="purchase"
            successMessage="Shares Purchased"
            formatSubmit={formatSubmit}
            lawLinks={purchaseLawLinks()}
            formOptions={{
                remainderVerb: "purchase",
                overVerb: "purchased",
                parcelHeading: "Parcels To Purchase"
            }}
            {...this.props}
        />
    }
}
