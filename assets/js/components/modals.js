"use strict";
import React from 'react';
import { connect } from 'react-redux';
import {nextModal, previousModal, endCreateCompany, endImportCompany} from '../actions';
import FormReducer from '../hoc/formReducer';
import CreateCompanyModal from './companyFull';
import ImportCompanyModal from './importCompany';

@connect(state => state.modals)
export default class Modals extends React.Component {
    render() {
        if(!this.props.showing){
            return false;
        }
        if(this.props.showing === 'createCompany'){
            return <FormReducer formName="companyFull" formKey="createCompanyModal">
                <CreateCompanyModal index={this.props.createCompany.index}
                next={() => {this.props.dispatch(nextModal('createCompany'))} }
                previous={() => {this.props.dispatch(previousModal('createCompany'))} }
                end={() => {this.props.dispatch(endCreateCompany())} } />
                </FormReducer>
        }
        if(this.props.showing === 'importCompany'){
            return <ImportCompanyModal index={this.props.importCompany.index}
                next={() => {this.props.dispatch(nextModal('importCompany'))} }
                previous={() => {this.props.dispatch(previousModal('importCompany'))} }
                end={() => {this.props.dispatch(endImportCompany())} } />
        }
    }
}