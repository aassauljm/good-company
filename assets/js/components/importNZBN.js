"use strict";
import React, {PropTypes} from 'react';
import TransactionView from './forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { importCompany, addNotification, requestResource } from '../actions';
import { reduxForm } from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { fieldStyle, fieldHelp, requiredFields, formFieldProps } from '../utils';
import { push } from 'react-router-redux'
import Loading from './loading';

const DEFAULT_OBJ = {};

@formFieldProps()
class SelectCompanies extends React.Component {
    render() {
        const { handleSubmit, fields, invalid } = this.props;
        return <form onSubmit={handleSubmit}>
            <div className="button-row">
                <ButtonInput onClick={() => fields.companies.map(c => c.selected.onChange(true) )} >Select All</ButtonInput>
                <ButtonInput onClick={() => fields.companies.map(c => c.selected.onChange(false) )} >Unselect All</ButtonInput>
            </div>
            <div className="row">
            <div className="col-md-6 col-md-offset-3">
                { fields.companies.map((company, i) => {
                    return <Input key={i} type="checkbox"  {...this.formFieldProps(['companies', i, 'selected'])}
                    label={(<span><strong>{this.props.companyData[i].companyName}</strong> { this.props.companyData[i].nzbn } { this.props.companyData[i].data.companyNumber} </span>)} />
                }) }
            </div>
            </div>
            <div className="button-row">
                <ButtonInput onClick={() => fields.companies.map(c => c.selected.onChange(true) )} >Select All</ButtonInput>
                <ButtonInput onClick={() => fields.companies.map(c => c.selected.onChange(false) )} >Unselect All</ButtonInput>
                <ButtonInput type="submit" bsStyle="primary" disabled={ invalid}>Import</ButtonInput>
            </div>
        </form>
    }
}


@reduxForm({
    fields: [
        'companies[].selected'
    ],
      validate: (values) => {
        const errors = {};
        if(!values.companies.some(c => c.selected)){
            errors._error = ['Please select at least one company']
        }
        return errors;
      },
    form: 'nzbnImport'
})
export class NZBNForm extends React.PureComponent {
    render() {
        return <form className="form">
            <SelectCompanies {...props} />
        </form>
    }
}



@connect(state => ({
    nzbn: state.resources['/nzbn'] || DEFAULT_OBJ
}), {
    requestListCompanies: () => requestResource('/nzbn')
})
export default class ImportNZBN extends React.PureComponent {
    static propTypes = {

    };

    fetch() {
        this.props.requestListCompanies();
    }

    componentDidMount() {
        this.fetch();
    }

    componentWillUpdate() {
        this.fetch();
    }


    renderForm() {
        const initiaValues = {companies: []};
        return <NZBNForm initiaValues={initiaValues} />
    }

    renderBody() {
        if(this.props.nzbn._status === 'fetching'){
            return <div>
                <p className="text-center">Requesting your list of companies...</p>
                <Loading />
            </div>
        }
        else if(this.props.nzbn._status === 'complete'){
            return this.renderForm();
        }
        else if(this.props.nzbn._status === 'error'){
            return <div className="alert alert-danger">
                Sorry, we could not contact the NZBN API service at this time.
            </div>
        }

        return;
    }

    render() {
        return <div className="container">
                <div className="widget">
                    <div className="widget-header">
                        <div className="widget-title">
                             Import with RealMe®
                        </div>
                    </div>
                    <div className="widget-body">
                        { this.renderBody() }
                    </div>
                </div>
            </div>
    }
}
