import { Route, Router, DefaultRoute } from 'react-router';
import React from 'react';
import Header from './header';
import Login from './login';
import Master from '../stores/master';
import {storeDecorator} from '../util';
import pureRender from 'pure-render-decorator';

@pureRender
@storeDecorator(Master)
export default class App extends React.Component {
    render() {
        console.log(this.state );
        return  <div>
            <Header loggedIn={this.state.loggedIn } userInfo={ this.state.userInfo }/>
             { this.state.loggedIn ? this.props.children  : <Login  {...this.state.login} /> }
        </div>
    }
}
