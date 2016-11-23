"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { nextTransactionView, previousTransactionView, endCreateCompany, endImportCompany, endTransactionView, showTransactionView } from '../actions';
import { IssueTransactionView } from './transactions/issue';
import { AcquisitionTransactionView } from './transactions/acquisition';
import { RedemptionTransactionView } from './transactions/redemption';
import { PurchaseTransactionView } from './transactions/purchase';
import { ConsolidationTransactionView } from './transactions/consolidation';
import { TransferTransactionView } from './transactions/transfer';
import { ApplyShareClassesTransactionView } from './transactions/applyShareClasses';
import { CompanyDetailsTransactionView } from './transactions/updateCompanyInfo';
import { NewHoldingTransactionView } from './transactions/newHolding';
import { UpdateHoldingTransactionView } from './transactions/updateHolding';
import { SelectHoldingTransactionView } from './transactions/selectHolding';
import { ImportHistoryTransactionView } from './transactions/importHistory';
import { NewPersonTransactionView } from './transactions/newPerson';
import { UpdatePersonTransactionView, UpdateHistoricPersonTransactionView } from './transactions/updatePerson';
import { SelectPersonTransactionView, SelectHistoricPersonTransactionView  } from './transactions/selectPerson';
import { SelectDirectorTransactionView  } from './transactions/selectDirector';
import { UpdateDirectorTransactionView  } from './transactions/updateDirector';
import { SubdivisionTransactionView  } from './transactions/subdivision';
import { ResolveAmbiguityTransactionView  } from './transactions/resolve';
import { DeleteCompanyTransactionView  } from './transactions/deleteCompany';
import { ChangeRegisteredOfficeTransactionView, ChangeAddressForServiceTransactionView  } from './transactions/changeAddress';
import { VotingShareholdersTransactionView  } from './transactions/selectVotingShareholders';
import { ShareClassCreateTransactionView, ShareClassEditTransactionView, ShareClassManageTransactionView } from './shareClasses';
import { AddAssignSharesTransactionView, ConsolidateDivideTransactionView, RepurchaseRedeemTransactionView,
    UpdateHoldingHolderTransactionView, ResetDeleteTransactionView, UpdateAddressesTransactionView } from './transactions/selection';
import { ContactDetailsTransactionView } from './contactDetails';
import { withRouter } from 'react-router'
import { push, replace } from 'react-router-redux';


export const TransactionViewSwitch = (props) => {

        switch(props.showing){

            case 'addAssignShares':
                return <AddAssignSharesTransactionView {...props} />

            case 'consolidateDivide':
                return <ConsolidateDivideTransactionView {...props} />

            case 'repurchaseRedeem':
                return <RepurchaseRedeemTransactionView {...props} />

            case 'updateHoldingHolder':
                return <UpdateHoldingHolderTransactionView {...props} />

            case 'subdivision':
                return <SubdivisionTransactionView {...props} />

            case 'applyShareClasses':
                return <ApplyShareClassesTransactionView {...props} />

            case 'updateCompany':
                return <CompanyDetailsTransactionView {...props} />

            case 'transfer':
                return <TransferTransactionView {...props} />

            case 'newHolding':
                return <NewHoldingTransactionView {...props} />

            case 'issue':
                return <IssueTransactionView {...props} />

            case 'acquisition':
                return <AcquisitionTransactionView {...props} />

            case 'consolidation':
                return <ConsolidationTransactionView {...props} />

            case 'purchase':
                return <PurchaseTransactionView {...props} />

            case 'redemption':
                return <RedemptionTransactionView {...props} />

            case 'updateAddresses':
                return <UpdateAddressesTransactionView {...props} />

            case 'newPerson':
                return <NewPersonTransactionView {...props} />

            case 'selectPerson':
                return <SelectPersonTransactionView {...props} />

            case 'selectHistoricPerson':
                return <SelectHistoricPersonTransactionView {...props} />

            case 'updatePerson':
                return <UpdateHistoricPersonTransactionView {...props} />

            case 'updateHistoricPerson':
                return <UpdateHistoricPersonTransactionView {...props} />

            case 'selectHolding':
                return <SelectHoldingTransactionView {...props} />

            case 'updateHolding':
                return <UpdateHoldingTransactionView {...props} />

            case 'selectDirector':
                return <SelectDirectorTransactionView {...props} />

            case 'updateDirector':
                return <UpdateDirectorTransactionView {...props} />

            case 'importHistory':
                return <ImportHistoryTransactionView {...props} />

            case 'resolveAmbiguity':
                return <ResolveAmbiguityTransactionView {...props} />

            case 'resetHistory':
                return <ResetHistoryTransactionView {...props} />

            case 'resetDelete':
                return <ResetDeleteTransactionView {...props} />

            case 'deleteCompany':
                return <DeleteCompanyTransactionView {...props} />

            case 'votingShareholders':
                return <VotingShareholdersTransactionView {...props} />

            case 'createShareClass':
                return <ShareClassCreateTransactionView {...props} />

            case 'editShareClass':
                return <ShareClassEditTransactionView {...props} />

            case 'manageShareClasses':
                return <ShareClassManageTransactionView {...props} />

            case 'changeRegisteredOffice':
                return <ChangeRegisteredOfficeTransactionView {...props} />

            case 'changeAddressForService':
                return <ChangeAddressForServiceTransactionView {...props} />

            case 'contactDetails':
                return <ContactDetailsTransactionView {...props} />

            default:
                return false;
        }

}


export class TransactionViews extends React.Component {
    renderTransactionView(showing) {
        const data = this.props[showing] || {};
        const props = {
            index: data.index,
            transactionViewData: data.data,
            currentData: {companyId: this.props.companyId, companyState: this.props.companyState},
            next : (...args) => {this.props.dispatch(nextTransactionView(this.props.showing, ...args))},
            previous: () => {this.props.dispatch(previousTransactionView(this.props.showing))},
            show: (key, extraData) => this.props.dispatch(showTransactionView(key, {...data.data, ...extraData})),
            navigate: (url) => this.props.dispatch(push(url)),
            end: (data) => {
                const after = (this.props[this.props.showing].data || {}).afterClose;
                this.props.dispatch(endTransactionView(this.props.showing, data));
                if(after){
                    if(after.showTransactionView){
                        this.props.dispatch(showTransactionView(after.showTransactionView.key, after.showTransactionView.data));
                    }
                    if(data && after.location){
                        this.props.dispatch(push(after.location));
                    }
                }

            }
        }
        return <TransactionViewSwitch showing={showing} {...props} />;
    }


    render() {
        if(!this.props.showing){
            return false;
        }
        return <div className="transaction-views">{ this.renderTransactionView(this.props.showing) }</div>

    }
}

const DEFAULT_OBJ = {};

const TransactionViewsConnected = connect(() => DEFAULT_OBJ)(TransactionViews);
export default TransactionViewsConnected;

