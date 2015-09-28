import { Route, Router, DefaultRoute } from 'react-router';
import React from 'react';
import Header from './header';
import Login from './login';
import pureRender from 'pure-render-decorator';
import { connect } from 'react-redux';
import { requestUserInfo } from '../actions';

@pureRender
@connect(state => state)
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
             { this.props.login.loggedIn ? this.props.children  : <Login /> }
             </div>
        </div>
    }
}
