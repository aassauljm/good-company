"use strict";
import React, {PropTypes} from 'react';
import { DecreaseTransactionView, createFormatSubmit } from './decreaseShares';

const formatSubmit = createFormatSubmit({baseTransaction: 'PURCHASE', fromTransaction: 'PURCHASE_FROM'})

export class PurchaseTransactionView extends React.Component {

    render() {
        return <DecreaseTransactionView
            title="Purchase of Shares"
            formName="purchase"
            successMessage="Shares Purchased"
            formatSubmit={formatSubmit}
            formOptions={{
                remainderVerb: "purchase",
                overVerb: "purchased",
                parcelHeading: "Parcels To Purchase"
            }}
            {...this.props}
        />
    }
}
