"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import { DecreaseTransactionView, createFormatSubmit } from './decreaseShares';

const formatSubmit = createFormatSubmit({baseTransaction: 'ACQUISITION', fromTransaction: 'ACQUISITION_FROM'})

export class AcquisitionTransactionView extends React.Component {

    render() {
        return <DecreaseTransactionView
            title="Acquisition of Shares"
            formName="acquisition"
            successMessage="Shares Acquired"
            formatSubmit={formatSubmit}
            formOptions={{
                remainderVerb: "acquire",
                overVerb: "acquired",
                parcelHeading: "Parcels To Acquire"
            }}
            {...this.props}
        />
    }
}
