"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { nextModal, previousModal, endCreateCompany, endImportCompany, endModal, showModal } from '../actions';
import FormReducer from '../hoc/formReducer';
import { IssueModal } from './transactions/issue';
import { AcquisitionModal } from './transactions/acquisition';
import { RedemptionModal } from './transactions/redemption';
import { PurchaseModal } from './transactions/purchase';
import { ConsolidationModal } from './transactions/consolidation';
import { TransferModal } from './transactions/transfer';
import { ApplyShareClassesModal } from './transactions/applyShareClasses';
import { CompanyDetailsModal } from './transactions/updateCompanyInfo';
import { NewHoldingModal } from './transactions/newHolding';
import { UpdateHoldingModal } from './transactions/updateHolding';
import { SelectHoldingModal } from './transactions/selectHolding';
import { ImportHistoryModal } from './transactions/importHistory';
import { NewPersonModal } from './transactions/newPerson';
import { UpdatePersonModal  } from './transactions/updatePerson';
import { SelectPersonModal  } from './transactions/selectPerson';
import { SelectDirectorModal  } from './transactions/selectDirector';
import { UpdateDirectorModal  } from './transactions/updateDirector';
import { SubdivisionModal  } from './transactions/subdivision';
import { ResolveAmbiguityModal  } from './transactions/resolve';
import { DeleteCompanyModal  } from './transactions/deleteCompany';
import { ResetHistoryModal  } from './transactions/resetHistory';
import { AddAssignSharesModal, ConsolidateDivideModal, RepurchaseRedeemModal, UpdateHoldingHolderModal, ResetDeleteModal } from './transactions/selection';
import { withRouter } from 'react-router'
import { push, replace } from 'react-router-redux';



export class Modals extends React.Component {


    renderModal(showing) {
        const data = this.props[showing] || {};
        const props = {
            ref: 'modal',
            index: data.index,
            modalData: data.data,
            next : (...args) => {this.props.dispatch(nextModal(this.props.showing, ...args))},
            previous: () => {this.props.dispatch(previousModal(this.props.showing))},
            show: (key) => this.props.dispatch(showModal(key, data.data)),
            navigate: (url) => this.props.dispatch(push(url)),
            end: (data) => {
                const after = (this.props[this.props.showing].data || {}).afterClose;
                this.props.dispatch(endModal(this.props.showing, data));
                if(after){
                    if(after.showModal){
                        this.props.dispatch(showModal(after.showModal.key, after.showModal.data));
                    }
                    if(data && after.location){
                        this.props.dispatch(push(after.location));
                    }
                }

            }
        }

        switch(this.props.showing){

            case 'addAssignShares':
                return <AddAssignSharesModal {...props} />

            case 'consolidateDivide':
                return <ConsolidateDivideModal {...props} />

            case 'repurchaseRedeem':
                return <RepurchaseRedeemModal {...props} />

            case 'updateHoldingHolder':
                return <UpdateHoldingHolderModal {...props} />

            case 'subdivision':
                return <SubdivisionModal {...props} />

            case 'applyShareClasses':
                return <ApplyShareClassesModal {...props} />

            case 'updateCompany':
                return <CompanyDetailsModal {...props} />

            case 'transfer':
                return <TransferModal {...props} />

            case 'newHolding':
                return <NewHoldingModal {...props} />

            case 'issue':
                return <IssueModal {...props} />

            case 'acquisition':
                return <AcquisitionModal {...props} />

            case 'consolidation':
                return <ConsolidationModal {...props} />

            case 'purchase':
                return <PurchaseModal {...props} />

            case 'redemption':
                return <RedemptionModal {...props} />

            case 'newPerson':
                return <NewPersonModal {...props} />

            case 'selectPerson':
                return <SelectPersonModal {...props} />

            case 'updatePerson':
                return <UpdatePersonModal {...props} />

            case 'selectHolding':
                return <SelectHoldingModal {...props} />

            case 'updateHolding':
                return <UpdateHoldingModal {...props} />

            case 'selectDirector':
                return <SelectDirectorModal {...props} />

            case 'updateDirector':
                return <UpdateDirectorModal {...props} />

            case 'importHistory':
                return <ImportHistoryModal {...props} />

            case 'resolveAmbiguity':
                return <ResolveAmbiguityModal {...props} />

            case 'resetHistory':
                return <ResetHistoryModal {...props} />

            case 'resetDelete':
                return <ResetDeleteModal {...props} />

            case 'deleteCompany':
                return <DeleteCompanyModal {...props} />

            default:
                return false;
        }
    }


    render() {
        if(!this.props.showing){
            return false;
        }
        return <div className="modals">{ this.renderModal(this.props.showing) }</div>

    }
}

const DEFAULT_OBJ = {};

const ModalsConnected = connect(() => DEFAULT_OBJ)(Modals);
export default ModalsConnected;