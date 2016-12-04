"use strict";
import React, {PropTypes} from 'react';
import { DecreaseTransactionView, createFormatSubmit } from './decreaseShares';
import LawBrowserLink from '../lawBrowserLink'


function redemptionLawLinks() {
    return <div>
        <LawBrowserLink title="Companies Act 1993" location="s 68">Meaning of redeemable share</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 69">Redemption at option of company</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 70, 108">Company must satisfy solvency test</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 71, 72">Special redemption of shares</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 7">Cancellation of shares redeemed by company</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 74">Redemption at option of shareholder</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 74">Redemption at option of shareholder</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 107(1)(d)">Redemption by entitled persons' agreement</LawBrowserLink>
        </div>
}


const formatSubmit = createFormatSubmit({baseTransaction: 'REDEMPTION', fromTransaction: 'REDEMPTION_FROM'})

export class RedemptionTransactionView extends React.Component {

    render() {
        return <DecreaseTransactionView
            title="Redemption of Shares"
            formName="redemption"
            successMessage="Shares Redeemed"
            formatSubmit={formatSubmit}
            lawLinks={redemptionLawLinks()}
            formOptions={{
                remainderVerb: "redeem",
                overVerb: "redeemed",
                parcelHeading: "Parcels To Redeem"
            }}
            {...this.props}
        />
    }
}
