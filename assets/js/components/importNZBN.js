"use strict";
import React, {PropTypes} from 'react';
import TransactionView from './forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { importCompany, addNotification, requestResource, importBulk } from '../actions';
import { reduxForm } from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { fieldStyle, fieldHelp, requiredFields, formFieldProps } from '../utils';
import { push } from 'react-router-redux'
import Loading from './loading';
import { realMeActions } from './importMenu';

const DEFAULT_OBJ = {};


@connect(undefined, realMeActions)
@formFieldProps()
class SelectCompanies extends React.Component {
    render() {
        const { handleSubmit, fields, invalid } = this.props;
        return <form onSubmit={handleSubmit}>
            <div className="button-row">
                <Button onClick={() => fields.companies.map(c => c.selected.onChange(true) )} >Select All</Button>
                <Button onClick={() => fields.companies.map(c => c.selected.onChange(false) )} >Unselect All</Button>
            </div>
            <div className="row">
            <div className="col-xs-12">
                { !!fields.companies.length && <div className="table-responsive">
                <table className="table table-striped">
                <thead>
                <tr><th></th><th>{STRINGS.companyName}</th><th>{STRINGS.nzbn}</th><th>{STRINGS.companyNumber}</th></tr>
                </thead>
                <tbody>
                { fields.companies.map((company, i) => {
                    return <tr key={i} className="actionable" onClick={() => fields.companies[i].selected.onChange(!fields.companies[i].selected.value)}>
                        <td>
                            <Input key={i} type="checkbox"  {...this.formFieldProps(['companies', i, 'selected'])} label={''} />
                        </td>
                        <td>
                            <strong>{this.props.companyData[i].companyName}</strong>
                        </td>
                        <td>{ this.props.companyData[i].nzbn } </td>
                        <td>{ this.props.companyData[i].companyNumber }</td>
                    </tr>
                }) }
                </tbody>
                </table>
            </div> }

            { !fields.companies.length && <div className="alert alert-warning">Sorry, it appears no your RealMe® account has no companies under it's authourity.</div> }
            </div>
            </div>
            <div className="button-row">
                <Button onClick={() => fields.companies.map(c => c.selected.onChange(true) )} >Select All</Button>
                <Button onClick={() => fields.companies.map(c => c.selected.onChange(false) )} >Unselect All</Button>
                <Button type="submit" bsStyle="primary" disabled={ invalid}>Import</Button>
            </div>
            <div className="button-row">
                <Button bsStyle="warning" onClick={this.props.disconnectNzbn}>Disconnect from RealMe®</Button>
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
        return  <SelectCompanies {...this.props} />
    }
}




@connect(state => ({
    nzbn: state.resources['/nzbn'] || DEFAULT_OBJ,
    bulk: state.importBulk
}), {
    requestListCompanies: () => requestResource('/nzbn'),
    importBulk: (data) => importBulk(data),
    addNotification: (data) => addNotification(data),
    navigateHome: () => push('/')
})
export default class ImportNZBN extends React.PureComponent {
    static propTypes = {

    };

    constructor(props){
        super(props);
        this.handleSubmit = ::this.handleSubmit;
    }

    fetch() {
        this.props.requestListCompanies()
            .catch(e => true);
    }

    componentDidMount() {
        this.fetch();
    }

    componentWillUpdate() {
        this.fetch();
    }

    getCompanies() {
        return this.props.nzbn.data;
    }

    handleSubmit(values) {
        const list = values.companies.map((c, i) => ({...c, ...this.getCompanies()[i]})).filter(c => c.selected).map(c => c.nzbn);
        this.props.importBulk({
            listType: 'nzbn',
            list: list
        })
            .then((result = {response: {message: 'No connection'}}) => {
                this.props.addNotification({message: `${list.length} Compan${list.length > 1 ? 'ies': 'y'} queued for import`});
                this.props.navigateHome();
            })
            .catch(error => {
                this.props.addNotification({message: `Could not import companies, Reason: ${error.message}`, error: true});
            });
    }

    renderForm() {
        const data = this.getCompanies();
        const initialValues = {companies: data.map(company => ({
            selected: true
        }))};
        return <NZBNForm initialValues={initialValues} companyData={data} onSubmit={this.handleSubmit}/>
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
