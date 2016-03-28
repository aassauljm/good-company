"use strict";
import React, {PropTypes} from 'react';
import { DecreaseModal, createFormatSubmit } from './decreaseShares';

const formatSubmit = createFormatSubmit({baseTransaction: 'REDEMPTION', fromTransaction: 'REDEMPTION_FROM'})

export class RedemptionModal extends React.Component {

    render() {
        return <DecreaseModal
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
