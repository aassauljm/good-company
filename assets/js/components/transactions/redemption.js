"use strict";
import React, {PropTypes} from 'react';
import { DecreaseTransactionView, createFormatSubmit } from './decreaseShares';

const formatSubmit = createFormatSubmit({baseTransaction: 'REDEMPTION', fromTransaction: 'REDEMPTION_FROM'})

export class RedemptionTransactionView extends React.Component {

    render() {
        return <DecreaseTransactionView
            title="Redemption of Shares"
            formName="redemption"
            successMessage="Shares Redeemed"
            formatSubmit={formatSubmit}
            formOptions={{
                remainderVerb: "redeem",
                overVerb: "redeemed",
                parcelHeading: "Parcels To Redeem"
            }}
            {...this.props}
        />
    }
}
