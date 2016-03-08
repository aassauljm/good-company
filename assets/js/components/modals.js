"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { nextModal, previousModal, endCreateCompany, endImportCompany, endModal } from '../actions';
import FormReducer from '../hoc/formReducer';
import CreateCompanyModal from './companyFull';
import ImportCompanyModal from './importCompany';
import { TransactionViewModal } from './transaction';
import IssueModal from './transactions/issue';
import TransferModal from './transactions/transfer';
//import { ShareClassesModal } from './transactions/shareClasses';

@connect(state => state.modals)
export default class Modals extends React.Component {
    render() {
        if(!this.props.showing){
            return false;
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
                return <ImportCompanyModal
                    index={this.props.importCompany.index}
                    modalData={this.props.importCompany.data}
                    next={(...args) => {this.props.dispatch(nextModal('importCompany', ...args))} }
                    previous={() => {this.props.dispatch(previousModal('importCompany'))} }
                    end={() => {this.props.dispatch(endImportCompany())} } />

            case 'transaction':
                return <TransactionViewModal
                    index={this.props.transaction.index}
                    modalData={this.props.transaction.data}
                    next={(...args) => {this.props.dispatch(nextModal('transaction', ...args))} }
                    previous={() => {this.props.dispatch(previousModal('transaction'))} }
                    end={() => {this.props.dispatch(endModal('transaction'))} } />

            case 'issue':
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

            /*case 'shareClasses':
                return <ShareClassesModal
                    index={this.props.shareClasses.index}
                    modalData={this.props.shareClasses.data}
                    next={(...args) => {this.props.dispatch(nextModal(this.props.showing, ...args))} }
                    previous={() => {this.props.dispatch(previousModal(this.props.showing))} }
                    end={() => {this.props.dispatch(endModal(this.props.showing))} } /> */

            default:
                return false;
        }

    }
}