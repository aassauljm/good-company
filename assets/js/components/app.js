import React from 'react';
import Header from './header';
import Login from './login';
import { pureRender } from '../utils';
import { connect } from 'react-redux';
import { requestUserInfo } from '../actions';
import { createResource } from '../actions'
import Notifications from './notifications';
import Modals from './modals';
import ReactCSSTransitionGroup from 'react/lib/ReactCSSTransitionGroup';


@connect(state => { return {login: state.login, userInfo: state.userInfo} })
export default class App extends React.Component {

    componentDidMount(){
        this.props.dispatch(requestUserInfo())
    }

    componentDidUpdate(){
        this.props.dispatch(requestUserInfo())
    }

    render() {
        const name = this.props.location.pathname;
        return <div>
            <Header loggedIn={this.props.login.loggedIn } userInfo={ this.props.userInfo }/>
                 <Notifications/>
                 <Modals />
                <div className="app-container" >
                  <ReactCSSTransitionGroup component="div" transitionName="page-transition" transitionEnterTimeout={200} transitionLeaveTimeout={200}>
                  <div key={name}>
                    { this.props.children }
                    </div>
                    </ReactCSSTransitionGroup>
                 </div>
            </div>
    }
}
