"use strict"
import React from 'react';
import { connect } from 'react-redux';
import { sortAlerts as alertPostProcess, processEvents} from '../utils';
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

const HOCFactory = ({resource, location, postProcess}, useAsyncConnect)  => ComposedComponent => {

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
        [stringOrFunction(resource, ownProps)]: state.resources[stringOrFunction(location, ownProps)] || DEFAULT
    });

    const actions = (dispatch, ownProps) => ({
        fetch: () => dispatch(requestResource(stringOrFunction(location, ownProps), {postProcess}))
    })

    if(useAsyncConnect){
        return asyncConnect([{
            promise: ({store: {dispatch, ownProps}}) => {
                return dispatch(requestResource(stringOrFunction(location, ownProps), {postProcess}))
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


export const FromRouteHOC = (mappingFunction) => (ComposedComponent) => {
    class Injector extends React.Component {
        render() {
            const {...props} = this.props;
            return <ComposedComponent {...props} {...mappingFunction(this.props.params)} />;
        }
    }
}

export const FAVOURITES = {resource: 'favourites', location: '/favourites'};
export const EVENTS = {resource: 'events', location: '/events', postProcess: processEvents};
export const ALERTS = {resource: 'alerts', location: '/alerts', postProcess: alertPostProcess};
export const RECENT_ACTIVITY = {resource: 'recent_activity', location: '/recent_activity' };
export const COMPANIES = {resource: 'companies', location: 'companies'};
export const COMPANY = {resource: props => `/company/${props.companyId}/get_info`, location: props => `/company/${props.companyId}/get_info`};


export const FavouritesHOC = (async) => HOCFactory(FAVOURITES, async);
export const AlertsHOC = (async) => HOCFactory(ALERTS, async);
export const CompaniesHOC = (async) => HOCFactory(COMPANIES,  async);
export const CompanyHOC = (async) => HOCFactory(COMPANY, async);
export const CompanyHOCFromRoute = (async) => FromRouteHOC((params) => ({companyId: params.id}))(CompanyHOC(async));



