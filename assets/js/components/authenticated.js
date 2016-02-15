import React from 'react';
import { connect } from 'react-redux';
import { routeActions } from 'react-router-redux'

export default (ComposedComponent) => {
    @connect(state => state.login)
    class AuthenticatedComponent extends React.Component {
        componentDidMount() {
            this.nav()
        }
        componentDidUpdate() {
            this.nav()
        }
        nav() {
            if(!this.props.loggedIn){
                this.props.dispatch(routeActions.push('/login'));
            }
        }
        render() {
          return ( <ComposedComponent {...this.props }/>);
        }

    }
    return AuthenticatedComponent;
}