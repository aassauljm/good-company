"use strict"
import React from 'react';
import { connect } from 'react-redux';
import { sortAlerts as alertPostProcess} from '../utils';
import { requestResource } from '../actions'

const HOCFactory = (resource, location, postProcess)  => ComposedComponent => {

    class Injector extends React.Component {

        fetch(){
            this.props.fetch()
        }

        componentDidMount() {
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

    return connect(state => ({
        [resource]: state.resources[location] || DEFAULT
    }), {
        fetch: () => requestResource(location, {postProcess})
    })(Injector)

}


export const FavouritesHOC = HOCFactory('favourites', '/favourites');
export const AlertsHOC = HOCFactory('alerts', '/alerts', alertPostProcess);