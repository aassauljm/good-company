"use strict";
import React, {PropTypes} from 'react';
import { DecreaseTransactionView, createFormatSubmit } from './decreaseShares';
import LawBrowserLink from '../lawBrowserLink'

const formatSubmit = createFormatSubmit({baseTransaction: 'CONSOLIDATION', fromTransaction: 'CONSOLIDATION_FROM'})

function consolidationLawLinks() {
    return <div>
        <LawBrowserLink title="Companies Act 1993" location='s 48(b)'>Reduced board obligations for proportional consolidation</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" definition="28784-DLM320605/28784-DLM319594">Share classes</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 35,96">Definitions of share and shareholder</LawBrowserLink>
    </div>
}


export class ConsolidationTransactionView extends React.Component {

    render() {
        return <DecreaseTransactionView
            lawLinks={consolidationLawLinks()}
            title="Consolidation of Shares"
            formName="consolidate"
            successMessage="Shares Consolidated"
            formatSubmit={formatSubmit}
            formOptions={{
                remainderVerb: "consolidate",
                overVerb: "consolidated",
                parcelHeading: "Shares To Consolidate"
            }}
            {...this.props}
        />
    }
}
