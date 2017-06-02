"use strict"
import React from 'react';
import { connect } from 'react-redux';
import { sortAlerts as alertPostProcess, processEvents, analyseCompany} from '../utils';
import { requestResource } from '../actions'
import { asyncConnect } from 'redux-connect';
import Promise from 'bluebird';



function stringOrFunction(input, props) {
    if (typeof input === 'function') {
        return input(props);
    } else {
        return input;
    }
}

const HOCFactory = ({resource, location, postProcess, propName}, useAsyncConnect, refreshOnMount)  => ComposedComponent => {

    class Injector extends React.PureComponent {

        fetch(refresh){
            this.props.fetch(refresh)
        }

        componentWillMount() {
            this.fetch(refreshOnMount);
        }

        componentDidUpdate() {
            this.fetch();
        }

        render() {
            const {...props} = this.props;
            return <ComposedComponent {...props} />;
        }
    }
    const DEFAULT = {};


    const stateToProps = (state, ownProps) => ({
        [propName ? propName : stringOrFunction(resource, ownProps)]: state.resources[stringOrFunction(location, ownProps)] || DEFAULT
    });

    const actions = (dispatch, ownProps) => ({
        fetch: (refresh) => dispatch(requestResource(stringOrFunction(location, ownProps), {postProcess, refresh}))
    })

    if(useAsyncConnect){
        return asyncConnect([{
            promise: (arg) => {
                return arg.store.dispatch(requestResource(stringOrFunction(location, arg), {postProcess}))
            }
        }],  stateToProps, actions)(Injector); //(connect(stateToProps, actions)(Injector))
    }
    else{
        return connect(stateToProps, actions)(Injector)
    }

}

export const AsyncHOCFactory = (resourceTuples)  => ComposedComponent => {

    class Injector extends React.PureComponent {

        fetch(){
            this.props.fetch()
        }

        componentWillMount() {
            this.fetch();
        }

        componentDidUpdate() {
            this.fetch();
        }

        render() {
            const {...props} = this.props;
            return <ComposedComponent {...props}  />;
        }
    }

    const DEFAULT = {};


    const stateToProps = (state, ownProps) => {
        return resourceTuples.reduce((acc, {resource, location, postProcess}) => {
            acc[stringOrFunction(resource, ownProps)] = state.resources[stringOrFunction(location, ownProps)] || DEFAULT
            return acc;
        }, {});
    };


    const actions = (dispatch, ownProps) => ({
        fetch: () => Promise.all(resourceTuples.map(({resource, location, postProcess}) => dispatch(requestResource(stringOrFunction(location, ownProps), {postProcess}))))
    });


    return asyncConnect([{
        promise: ({store: {dispatch, ownProps}}) => {
            return Promise.all(resourceTuples.map(({resource, location, postProcess}) => dispatch(requestResource(stringOrFunction(location, ownProps), {postProcess}))))
        }
    }],  stateToProps, actions)(Injector);
}



/*
export const FromRouteHOC = (mappingFunction) => (ComposedComponent) => {

    return  class Injector extends React.Component {
        render() {
            const {...props} = this.props;
            return <ComposedComponent {...props} {...mappingFunction(this.props.params)} />;
        }
    }
}*/


export const EVENTS = {resource: 'events', location: '/events', postProcess: processEvents};
export const ALERTS = {resource: 'alerts', location: '/alerts', postProcess: alertPostProcess};
export const RECENT_ACTIVITY = {resource: 'recent_activity', location: '/recent_activity' };
export const COMPANIES = {resource: 'companies', location: 'companies'};
export const COMPANY = {resource: props => `/company/${props.companyId}/get_info`, location: props => `/company/${props.companyId}/get_info`, postProcess: analyseCompany};
export const DOCUMENTS = {resource: props => `/company/${props.companyId}/documents`, location: props => `/company/${props.companyId}/documents`, propName: 'documents'};
export const DOCUMENTS_FROM_ROUTE = {resource: props => `/company/${props.params.id}/documents`, location: props => `/company/${props.params.id}/documents`, propName: 'documents'};
export const FOREIGN_PERMISSIONS = {resource: props => `/company/${props.companyId}/foreign_permissions`, location: props => `/company/${props.companyId}/foreign_permissions`, propName: 'foreignPermissions'};
export const ANNUAL_RETURN = {resource: props => `/company/${props.companyId}/ar_summary`, location: props => `/company/${props.companyId}/ar_summary`, propName: 'arSummary'};
export const ANNUAL_RETURN_FROM_ROUTE = {resource: props => `/company/${props.params.id}/ar_summary`, location: props => `/company/${props.params.id}/ar_summary`, propName: 'arSummary'};
export const COMPANY_FROM_ROUTE = {resource: props => `/company/${props.params.id}/get_info`, location: props => `/company/${props.params.id}/get_info`, postProcess: analyseCompany};
export const COMPANY_FROM_DATED_ROUTE = {resource: props => `/company/${props.params.id}/at_date/${props.params.date}`, location: props => `/company/${props.params.id}/at_date/${props.params.date}`, postProcess: analyseCompany};
export const ALL_PERSONS = {resource: props => `/company/${props.companyId}/all_persons`, location: props => `/company/${props.companyId}/all_persons`};
export const INTERESTS_REGISTER_FROM_ROUTE = {resource: props => `/company/${props.params.id}/interests_register`, location: props => `/company/${props.params.id}/interests_register`, propName: 'interestsRegister'};

export const AlertsHOC = (async, refreshOnMount) => HOCFactory(ALERTS, async, refreshOnMount);
export const CompaniesHOC = (async, refreshOnMount) => HOCFactory(COMPANIES,  async, refreshOnMount);
export const CompanyHOC = (async, refreshOnMount) => HOCFactory(COMPANY, async, refreshOnMount);
export const ForeignPermissionsHOC = (async, refreshOnMount) => HOCFactory(FOREIGN_PERMISSIONS, async, refreshOnMount);
export const CompanyFromRouteHOC = (async, refreshOnMount) => HOCFactory(COMPANY_FROM_ROUTE, async, refreshOnMount);
export const CompanyDatedHOCFromRoute = (async, refreshOnMount) => HOCFactory(COMPANY_FROM_DATED_ROUTE, async, refreshOnMount);
export const DocumentsHOC = (async, refreshOnMount) => HOCFactory(DOCUMENTS, async, refreshOnMount);
export const DocumentsHOCFromRoute = (async, refreshOnMount) => HOCFactory(DOCUMENTS_FROM_ROUTE, async, refreshOnMount);
export const AnnualReturnHOC = (async, refreshOnMount) => HOCFactory(ANNUAL_RETURN, async, refreshOnMount);
export const AnnualReturnFromRouteHOC = (async, refreshOnMount) => HOCFactory(ANNUAL_RETURN_FROM_ROUTE, async, refreshOnMount);
export const AllPersonsHOC = (async, refreshOnMount) => HOCFactory(ALL_PERSONS, async, refreshOnMount);
export const InterestsRegisterFromRouteHOC = (async, refreshOnMount) => HOCFactory(INTERESTS_REGISTER_FROM_ROUTE, async, refreshOnMount);


export const Injector = (props) => { const {children, ...rest} = props;  return React.cloneElement(children, rest) };

