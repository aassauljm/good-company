"use strict";
import React, {PropTypes} from 'react';
import { DecreaseModal, createFormatSubmit } from './decreaseShares';

const formatSubmit = createFormatSubmit({baseTransaction: 'CONSOLIDATION', fromTransaction: 'CONSOLIDATION_FROM'})

export class ConsolidationModal extends React.Component {

    render() {
        return <DecreaseModal
            title="Consolidation of Shares"
            formName="consolidate"
            successMessage="Shares Consolidated"
            formatSubmit={formatSubmit}
            formOptions={{
                remainderVerb: "consolidate",
                overVerb: "consolidated",
                parcelHeading: "Parcels To Consolidate"
            }}
            {...this.props}
        />
    }
}
