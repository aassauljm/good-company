"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { nextModal, previousModal, endCreateCompany, endImportCompany, endModal, showModal } from '../actions';
import FormReducer from '../hoc/formReducer';
import CreateCompanyModal from './companyFull';
import ImportCompanyModal from './importCompany';
import { TransactionViewModal } from './transaction';
import { IssueModal } from './transactions/issue';
import { TransferModal } from './transactions/transfer';
import { ApplyShareClassesModal } from './transactions/applyShareClasses';
import { CompanyDetailsModal } from './transactions/updateCompanyInfo';
import { NewHoldingModal } from './transactions/newHolding';
import { UpdateHoldingModal } from './transactions/updateHolding';
import { NewPersonModal } from './transactions/newPerson';
import { UpdatePersonModal  } from './transactions/updatePerson';

@connect(state => state.modals)
export default class Modals extends React.Component {
    render() {
        if(!this.props.showing){
            return false;
        }
        const data = this.props[this.props.showing] || {};
        const props = {
            index: data.index,
            modalData: data.data,
            next : (...args) => {this.props.dispatch(nextModal(this.props.showing, ...args))},
            previous: () => {this.props.dispatch(previousModal(this.props.showing))},
            end: (data) => {
                const after = this.props[this.props.showing].data.afterClose;
                this.props.dispatch(endModal(this.props.showing, data));
                if(after){
                    if(after.showModal){
                        this.props.dispatch(showModal(after.showModal.key, after.showModal.data))
                    }
                }

            }
        }

        switch(this.props.showing){
            case 'createCompany' :
                const formKey = "createCompanyModal";
                return <FormReducer formName="companyFull" formKey={formKey}>
                    <CreateCompanyModal index={this.props.createCompany.index}
                    next={(...args) => {this.props.dispatch(nextModal('createCompany', ...args))} }
                    previous={() => {this.props.dispatch(previousModal('createCompany'))} }
                    end={() => {this.props.dispatch(endCreateCompany(formKey))} } />
                    </FormReducer>

            case 'importCompany':
                return <ImportCompanyModal {...props} />

            case 'transaction':
                return <TransactionViewModal {...props} />

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

            case 'newPerson':
                return <NewPersonModal {...props} />

            case 'updatePerson':
                return <UpdatePersonModal {...props} />

            case 'updateHolding':
                return <UpdateHoldingModal {...props} />

            default:
                return false;
        }

    }
}