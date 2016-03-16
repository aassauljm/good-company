"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { nextModal, previousModal, endCreateCompany, endImportCompany, endModal, showModal } from '../actions';
import FormReducer from '../hoc/formReducer';
import CreateCompanyModal from './companyFull';
import ImportCompanyModal from './importCompany';
import { TransactionViewModal } from './transaction';
import IssueModal from './transactions/issue';
import { TransferModal } from './transactions/transfer';
import { ApplyShareClassesModal } from './transactions/applyShareClasses';
import { CompanyDetailsModal } from './transactions/updateCompanyInfo';
import { NewHoldingModal } from './transactions/newHolding';

            /*case 'issue':
                return <IssueModal
                    index={this.props.issue.index}
                    modalData={this.props.issue.data}
                    next={(...args) => {this.props.dispatch(nextModal(this.props.showing, ...args))} }
                    previous={() => {this.props.dispatch(previousModal(this.props.showing))} }
                    end={() => {this.props.dispatch(endModal(this.props.showing))} } />
            case 'transfer':
                return <TransferModal
                    index={this.props.issue.index}
                    modalData={this.props.issue.data}
                    next={(...args) => {this.props.dispatch(nextModal(this.props.showing, ...args))} }
                    previous={() => {this.props.dispatch(previousModal(this.props.showing))} }
                    end={() => {this.props.dispatch(endModal(this.props.showing))} } />
                    */

            /*case 'shareClasses':
                return <ShareClassesModal
                    index={this.props.shareClasses.index}
                    modalData={this.props.shareClasses.data}
                    next={(...args) => {this.props.dispatch(nextModal(this.props.showing, ...args))} }
                    previous={() => {this.props.dispatch(previousModal(this.props.showing))} }
                    end={() => {this.props.dispatch(endModal(this.props.showing))} } /> */

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
                this.props.dispatch(endModal(this.props.showing, data));
                const after = this.props[this.props.showing].data.afterClose;
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
            default:
                return false;
        }

    }
}