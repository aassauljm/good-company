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

const HOCFactory = ({resource, location, postProcess, propName}, useAsyncConnect)  => ComposedComponent => {

    class Injector extends React.Component {

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
            return <ComposedComponent {...props} />;
        }
    }
    const DEFAULT = {};


    const stateToProps = (state, ownProps) => ({
        [propName ? propName : stringOrFunction(resource, ownProps)]: state.resources[stringOrFunction(location, ownProps)] || DEFAULT
    });

    const actions = (dispatch, ownProps) => ({
        fetch: () => dispatch(requestResource(stringOrFunction(location, ownProps), {postProcess}))
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

    class Injector extends React.Component {

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
            return <ComposedComponent {...props} />;
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

export const FAVOURITES = {resource: 'favourites', location: '/favourites'};
export const EVENTS = {resource: 'events', location: '/events', postProcess: processEvents};
export const ALERTS = {resource: 'alerts', location: '/alerts', postProcess: alertPostProcess};
export const RECENT_ACTIVITY = {resource: 'recent_activity', location: '/recent_activity' };
export const COMPANIES = {resource: 'companies', location: 'companies'};
export const COMPANY = {resource: props => `/company/${props.companyId}/get_info`, location: props => `/company/${props.companyId}/get_info`, postProcess: analyseCompany};
export const DOCUMENTS = {resource: props => `/company/${props.params.id}/documents`, location: props => `/company/${props.params.id}/documents`, propName: 'documents'};
export const FOREIGN_PERMISSIONS = {resource: props => `/company/${props.companyId}/foreign_permissions`, location: props => `/company/${props.companyId}/foreign_permissions`, propName: 'foreignPermissions'};
export const COMPANY_FROM_ROUTE = {resource: props => `/company/${props.params.id}/get_info`, location: props => `/company/${props.params.id}/get_info`, postProcess: analyseCompany};
export const COMPANY_FROM_DATED_ROUTE = {resource: props => `/company/${props.params.id}/at_date/${props.params.date}`, location: props => `/company/${props.params.id}/at_date/${props.params.date}`, postProcess: analyseCompany};


export const FavouritesHOC = (async) => HOCFactory(FAVOURITES, async);
export const AlertsHOC = (async) => HOCFactory(ALERTS, async);
export const CompaniesHOC = (async) => HOCFactory(COMPANIES,  async);
export const CompanyHOC = (async) => HOCFactory(COMPANY, async);
export const ForeignPermissionsHOC = (async) => HOCFactory(FOREIGN_PERMISSIONS, async);
export const CompanyHOCFromRoute = (async) => HOCFactory(COMPANY_FROM_ROUTE, async);
export const CompanyDatedHOCFromRoute = (async) => HOCFactory(COMPANY_FROM_DATED_ROUTE, async);
export const DocumentsHOCFromRoute = (async) => HOCFactory(DOCUMENTS, async);

export const Injector = (props) => { const {children, ...rest} = props;  return React.cloneElement(children, rest) };

