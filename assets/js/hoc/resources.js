"use strict"
import React from 'react';
import { connect } from 'react-redux';
import { sortAlerts as alertPostProcess} from '../utils';
import { requestResource } from '../actions'
import { asyncConnect } from 'redux-connect';

function stringOrFunction(input, props) {
    if (typeof input === 'function') {
        return input(props);
    } else {
        return input;
    }
}

const HOCFactory = (resource, location, postProcess, useAsyncConnect)  => ComposedComponent => {

    class Injector extends React.Component {

        fetch(){
            this.props.fetch()
        }

        componentDidlMount() {
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

export const FromRouteHOC = (mappingFunction) => (ComposedComponent) => {
    class Injector extends React.Component {
        render() {
            const {...props} = this.props;
            return <ComposedComponent {...props} {...mappingFunction(this.props.params)} />;
        }
    }
}

export const FavouritesHOC = (async) => HOCFactory('favourites', '/favourites', null, async);
export const AlertsHOC = (async) => HOCFactory('alerts', '/alerts', alertPostProcess, async);
export const CompaniesHOC = (async) => HOCFactory('companies', 'companies', async);
export const CompanyHOC = (async) => HOCFactory('company', props => `/company/${props.companyId}/get_info`, async);
export const CompanyHOCFromRoute = (async) => FromRouteHOC((params) => ({companyId: params.id}))(CompanyHOC(async));
