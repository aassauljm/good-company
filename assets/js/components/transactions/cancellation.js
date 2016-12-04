"use strict";
import React, {PropTypes} from 'react';
import { DecreaseTransactionView, createFormatSubmit } from './decreaseShares';
import LawBrowserLink from '../lawBrowserLink'

const formatSubmit = createFormatSubmit({baseTransaction: 'CANCELLATION', fromTransaction: 'CANCELLATION_FROM'})


function cancellationLawLinks() {
    return <div>
        <LawBrowserLink title="Companies Act 1993" location="s 97, 99">Liability of shareholders</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 98, 99">Liability of former shareholders </LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 100">Liability for calls</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 222(1)(b), 222(2)(b),(ii)">Cancellation of shares on amalgamation</LawBrowserLink>
    </div>
}


export class CancellationTransactionView extends React.Component {

    render() {
        return <DecreaseTransactionView
            lawLinks={cancellationLawLinks()}
            title="Cancellation of Shares"
            formName="cancellation"
            successMessage="Shares Cancelled"
            formatSubmit={formatSubmit}
            formOptions={{
                remainderVerb: "cancel",
                overVerb: "cancel",
                parcelHeading: "Shares To Cancel"
            }}
            {...this.props}
        />
    }
}
