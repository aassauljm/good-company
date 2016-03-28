"use strict";
import React, {PropTypes} from 'react';
import { DecreaseModal, createFormatSubmit } from './decreaseShares';

const formatSubmit = createFormatSubmit({baseTransaction: 'ACQUISITION', fromTransaction: 'ACQUISITION_FROM'})

export class AcquisitionModal extends React.Component {

    render() {
        return <DecreaseModal
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
