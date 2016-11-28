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

    return (useAsyncConnect ? asyncConnect : connect)((state, ownProps) => ({
        [stringOrFunction(resource, ownProps)]: state.resources[stringOrFunction(location, ownProps)] || DEFAULT
    }), (dispatch, ownProps) => ({
        fetch: () => dispatch(requestResource(stringOrFunction(location, ownProps), {postProcess}))
    }))(Injector)

}

export const FromRouteHOC = (mappingFunction) => (ComposedComponent) => {
    class Injector extends React.Component {
        render() {
            const {...props} = this.props;
            return <ComposedComponent {...props} {...mappingFunction(this.props.params)} />;
        }
    }
}

export const FavouritesHOC = HOCFactory('favourites', '/favourites');
export const AlertsHOC = HOCFactory('alerts', '/alerts', alertPostProcess);
export const CompaniesHOC = HOCFactory('companies', 'companies');
export const CompanyHOC = HOCFactory('company', props => `/company/${props.companyId}/get_info`);
export const CompanyHOCFromRoute = FromRouteHOC((params) => ({companyId: params.id}))(CompanyHOC);
