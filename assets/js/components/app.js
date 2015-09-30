import { Route, Router, DefaultRoute } from 'react-router';
import React from 'react';
import Header from './header';
import Login from './login';
import { pureRender } from '../utils';
import { connect } from 'react-redux';
import { requestUserInfo } from '../actions';
import { pushState, replaceState } from 'redux-router';


@connect(state => state, dispatch => {return {dispatch: dispatch, pushState: pushState, replaceState: replaceState}})
export default class App extends React.Component {
    componentDidMount(){
        this.props.dispatch(requestUserInfo())
    }
    componentDidUpdate(){
        this.props.dispatch(requestUserInfo())
    }
    render() {
        return  <div>
            <Header loggedIn={this.props.login.loggedIn } userInfo={ this.props.userInfo }/>
            <div className="container">
                { this.props.children }
             </div>
        </div>
    }
}
