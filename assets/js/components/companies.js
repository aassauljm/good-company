"use strict";
import React from 'react';
import { requestResource, resetResources, deleteResource, startCreateCompany, startImportCompany, addNotification} from '../actions';
import { pureRender } from '../utils';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from './forms/buttonInput';
import { reduxForm, reset } from 'redux-form';
import { push } from 'react-router-redux'
import { Link } from 'react-router';
import STRINGS from '../strings'
import { asyncConnect } from 'redux-connect';
import { requestAlerts } from './alerts';
import { CompanyAlertsBase } from './companyAlerts';
import Input from './forms/input'
import Promise from 'bluebird';

import Widget from './widget';
import LawBrowserContainer from './lawBrowserContainer';
import FavouriteControl from './favourites'
import firstBy from 'thenby';



const DEFAULT_OBJ = {};


const CompanyItem = (props) => {
    return <div className="company-view">
        <Link to={`/company/view/${props.company.id}`}>
        <h2>{ props.company.companyName }</h2>
        <h3><span className="sub-label">{ STRINGS['owner'] }:</span> { props.company.owner }</h3>
        <h3><span className="sub-label">{ STRINGS['companyNumber'] }:</span> { props.company.companyNumber }</h3>
        <h3><span className="sub-label">{ STRINGS['nzbn'] }:</span> { props.company.nzbn }</h3>
        <h3><span className="sub-label">{ STRINGS['companyStatus'] }:</span> { props.company.companyStatus }</h3>
        <h3><span className="sub-label">{ STRINGS['entityType'] }:</span> { props.company.entityType }</h3>
        </Link>
        <CompanyAlertsBase companyState={props.company} companyId={`${props.company.id}`} showTypes={['danger', 'warning', 'pending']} showAllWarnings={true}/>
    </div>
}


class SelectCompaniesTable extends React.PureComponent {
    constructor(props){
        super();
        this.selectAll = ::this.selectAll;
        this.selectNone = ::this.selectNone;
        this.deleteSelected = ::this.deleteSelected;
    }

    selectAll() {
        this.props.fields.companies.map(c => c.selected.onChange(true));
    }

    selectNone() {
        this.props.fields.companies.map(c => c.selected.onChange(false));
    }

    deleteSelected() {
        this.props.delete(this.props.fields.companies.filter(c => c.selected.value).map(c => c.companyId.value));
    }

    controls() {
        return  <div className="button-row">
                <ButtonInput onClick={this.selectAll} >Select All</ButtonInput>
                <ButtonInput onClick={this.selectNone} >Unselect All</ButtonInput>
                <ButtonInput onClick={this.deleteSelected} bsStyle="danger">Delete Selected</ButtonInput>
            </div>
    }

    render() {
        const { handleSubmit, fields, invalid } = this.props;
        const fieldNames = ['id', 'companyName', 'companyNumber', 'nzbn', 'owner'];
        let className = "table table-striped table-hover ";
        const handleClick = (event, id) => {
            event.preventDefault();
            this.props.push(id);
        }
        return <form onSubmit={handleSubmit}>
        { this.controls () }
            <div className="table-responsive">
                <table className={className}>
                    <thead><tr><th/>
                        { fieldNames.map(f => <th key={f}>{STRINGS[f]}</th>) }
                        </tr></thead>
                    <tbody>
                    { this.props.fields.companies.map(
                        (row, i) => {
                            row = this.props.companies[i];
                            return <tr key={i} >
                                <td><Input key={i} type="checkbox"  {...fields['companies'][i]['selected']} /></td>
                                { fieldNames.map(f => {
                                    let onClick = null;
                                    if(f === 'companyName'){
                                       onClick = (e) => handleClick(e, row.companyId)
                                    }
                                    return <td key={f} onClick={onClick}>{row[f]}</td>
                                }) }
                            </tr>}) }
                    </tbody>
                </table>
            </div>
            { this.controls () }
        </form>
    }
}

const SelectCompaniesTableConnected = reduxForm({
  form: 'selectCompaniesTable',
  fields: [
    'companies[].selected',
    'companies[].companyId',
  ]
})(SelectCompaniesTable);


const CompaniesRenderHOC = ComposedComponent => class extends React.Component {

    renderTable(data, condensed, favouriteAction) {
        const handleClick = (event, id) => {
            event.preventDefault();
            this.props.push(id);
        }
        const fields = ['companyName', 'companyNumber', 'nzbn'];

        let className = "table table-striped table-hover ";
        if(condensed){
            className += "table-condensed ";
        }
        else{
            fields.push('owner')
        }
        return <div className="table-responsive">
        <table className={className}>
            <thead><tr>
                    <th></th>
                    { fields.map(f => <th key={f}>{STRINGS[f]}</th>) }
                    {!condensed && <th>{ STRINGS.permissions.read } </th> }
                    {!condensed && <th>{ STRINGS.permissions.update } </th> }


            </tr></thead>
            <tbody>
            { data.filter(d => !d.deleted).map(
                (row, i) => <tr key={i} onClick={(e) => handleClick(e, row.id) }>
                <td><FavouriteControl isFavourite={row.favourite} companyId={row.id} action={favouriteAction}/></td>
                { fields.map(f => <td key={f}>{row[f]}</td>) }
                {!condensed && <td>{ (row.permissions || []).indexOf('read') >= 0 ? 'Yes' : 'No' }</td> }
                {!condensed && <td>{ (row.permissions || []).indexOf('update') >= 0 ? 'Yes' : 'No'}</td> }
                </tr> )
            }
            </tbody>
        </table>
        </div>
    }

    renderList(data) {
        return <div className="company-list col-md-8 col-md-offset-2">
            {
                data.map((company, i) => <CompanyItem company={company} key={i} />)
            }
        </div>
    }

    render() {
        return <ComposedComponent {...this.props} renderTable={::this.renderTable} renderList={::this.renderList}/>;
    }
}



@asyncConnect([{
    promise: ({store: {dispatch, getState}}) => {
        return dispatch(requestResource('companies'));
    }
}],
    state => ({companies: state.resources[`companies`] || DEFAULT_OBJ}),
{
    push: (id) => push(`/company/view/${id}`),
    handleImport: () => push('/import'),
    addNotification: (args) => addNotification(args),
    deleteResource: (...args) => deleteResource(...args),
    resetResources: () => resetResources(),
})
@CompaniesRenderHOC
export class CompaniesDelete extends React.Component {

    constructor(props) {
        super();
        this.delete = ::this.delete;
    }
    delete(ids) {
        if(!ids.length){
            return;
        }
        Promise.each(ids, (id, i) => {
            const options = {};
            const companyName = this.props.companies.data.find(c => c.id === id).currentCompanyState.companyName;
            if(i === 0){
                options.confirmation = {
                    title: 'Confirm Deletion',
                    description: ids.length > 1 ?
                        `Please confirm the deletion of the selected ${ids.length} companies.`:
                        `Please confirm the deletion of ${companyName}`,
                    resolveMessage: 'Confirm Deletion',
                    resolveBsStyle: 'danger'
                };
            }
            options.loadingMessage = `Deleting ${companyName}`;
            options.loadingOptions = {animationTime: ids.length > 1 ? 0 : null}
            options.invalidates = [];
            return this.props.deleteResource(`/company/${id}`, options);
        })
        .then(() => {
            return this.props.addNotification({message: `${ids.length} companies deleted`})
        })
        .catch((e) => {
            return this.props.addNotification({message: e.message, error: true})
        })
        .then(() => {
           this.props.resetResources();
        });

    }
    renderBody() {

        const filteredCompanies = (this.props.companies.data || [])
            .filter(c => !c.deleted)
            .filter(c => c.permissions.indexOf('update') >= 0)
            .map(c => ({...c, ...c.currentCompanyState, companyId: c.id}));

        if(!filteredCompanies.length){
            return <div>No Companies</div>
        }

        const initialValues = {companies: filteredCompanies
                                    .map(c => ({companyName: c.companyName, companyId: c.companyId}) )}
        return <div className="company-list-body">
           <div className="button-row">
                { /* <Button bsStyle="success" onClick={::this.handleNew }>Create New</Button> */ }
                { /*<Button bsStyle="info" className="company-import" onClick={this.props.handleImport}>Bulk Import</Button> */}
            </div>

            <SelectCompaniesTableConnected initialValues={initialValues} companies={filteredCompanies} push={this.props.push} delete={this.delete}/>
        </div>

    }

    render() {

    return <LawBrowserContainer>
            <Widget iconClass="fa fa-institution" title="Companies">
                   { this.renderBody() }
            </Widget>
        </LawBrowserContainer>
    }
}


@asyncConnect([{
    promise: ({store: {dispatch, getState}}) => {
        return dispatch(requestResource('companies'));
    }
}],
    state => ({companies: state.resources[`companies`] || DEFAULT_OBJ, userInfo: state.userInfo}),
{
    push: (id) => push(`/company/view/${id}`),
    handleImport: () => push('/import')
})
@CompaniesRenderHOC
export default class Companies extends React.Component {

    renderBody() {
        const canImport = this.props.userInfo.permissions.company.indexOf('create') >= 0;
        const filteredCompanies = (this.props.companies.data || [])
            .filter(c => !c.deleted)
            .map(c => ({ ...c.currentCompanyState, ...c, companyId: c.id}));



        const initialValues = {companies: filteredCompanies
                                    .map(c => ({companyName: c.companyName, companyId: c.companyId}) )}
        return <div className="company-list-body">
           <div className="button-row">
                <Link to="/companies/manage" className="btn btn-danger">Manage Companies</Link>
                {canImport && <Link to="/import" className="btn btn-info">Import Companies</Link> }
            </div>
             { this.props.renderTable(filteredCompanies, false, true) }
        </div>

    }

    render() {
    return <LawBrowserContainer>
            <Widget iconClass="fa fa-institution" title="Companies">
                   { this.renderBody() }
            </Widget>
        </LawBrowserContainer>
    }
}



@asyncConnect([{
    promise: ({store: {dispatch, getState}}) => {
        return dispatch(requestResource('companies'));
    }
}],
    state => ({companies: state.resources[`companies`]}),
{
    requestData: () => requestResource(`companies`),
    handleImport: () => push('/import'),
    push: (id) => push(`/company/view/${id}`)
})
@CompaniesRenderHOC
export class CompaniesWidget extends React.Component {

    fetch() {
        return this.props.requestData();
    }

    componentDidMount() {
        this.fetch();
    }

    componentDidUpdate() {
        this.fetch();
    };

    renderBody() {

        const data = (this.props.companies.data || []).filter(c => !c.deleted).map(c => ({...c.currentCompanyState, ...c}));
        data.sort(firstBy('favourite', -1).thenBy(c => c.currentCompanyState.companyName))
        return this.props.renderTable(data.slice(0, 6), true, false);
    }



    render() {
        return <Widget className="companies-widget" iconClass="fa fa-institution" title="Companies" link="/companies">
                       { this.renderBody() }
                </Widget>
    }
}
