import React from 'react';
import { connect } from 'react-redux';
import { routeActions } from 'react-router-redux'

export default (ComposedComponent) => {
    @connect(state => state.login)
    class AuthenticatedComponent extends React.Component {
        componentWillMount() {
            this.nav()
        }
        componentDidMount() {
            this.nav()
        }
        componentDidUpdate() {
            this.nav()
        }
        nav() {
            const redirectAfterLogin = this.props.location.pathname;
            if(!this.props.loggedIn){
                this.props.dispatch(routeActions.push(`/login?next=${redirectAfterLogin}`));
            }
        }
        render() {
            if(this.props.loggedIn){
                return  <ComposedComponent {...this.props }/>;
            }
            return false;

        }

    }
    return AuthenticatedComponent;
}