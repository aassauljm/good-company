"use strict";
import React from 'react';
import { connect } from 'react-redux';
import {nextModal, previousModal, endCreateCompany, endImportCompany, endModal} from '../actions';
import FormReducer from '../hoc/formReducer';
import CreateCompanyModal from './companyFull';
import ImportCompanyModal from './importCompany';
import {TransactionViewModal} from './transaction';

@connect(state => state.modals)
export default class Modals extends React.Component {
    render() {
        if(!this.props.showing){
            return false;
        }
        if(this.props.showing === 'createCompany'){
            const formKey = "createCompanyModal";
            return <FormReducer formName="companyFull" formKey={formKey}>
                <CreateCompanyModal index={this.props.createCompany.index}
                next={(...args) => {this.props.dispatch(nextModal('createCompany', ...args))} }
                previous={() => {this.props.dispatch(previousModal('createCompany'))} }
                end={() => {this.props.dispatch(endCreateCompany(formKey))} } />
                </FormReducer>
        }
        if(this.props.showing === 'importCompany'){
            return <ImportCompanyModal
                index={this.props.importCompany.index}
                modalData={this.props.importCompany.data}
                next={(...args) => {this.props.dispatch(nextModal('importCompany', ...args))} }
                previous={() => {this.props.dispatch(previousModal('importCompany'))} }
                end={() => {this.props.dispatch(endImportCompany())} } />
        }
        if(this.props.showing === 'transaction'){
            return <TransactionViewModal
                index={this.props.transaction.index}
                modalData={this.props.transaction.data}
                next={(...args) => {this.props.dispatch(nextModal('transaction', ...args))} }
                previous={() => {this.props.dispatch(previousModal('transaction'))} }
                end={() => {this.props.dispatch(endModal('transaction'))} } />
        }


    }
}