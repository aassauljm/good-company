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
import { asyncConnect } from 'redux-async-connect';

function prevent(e){
    e.preventDefault();
    e.stopPropagation();
}

const transition = __SERVER__ ? 0 : 200;

@asyncConnect([{
  promise: ({store: {dispatch, getState}}) => {
    const promises = [];
    promises.push(dispatch(requestUserInfo()))
    return Promise.all(promises);
  }
}])
@connect(state => { return {login: state.login, userInfo: state.userInfo} })
export default class App extends React.Component {
    render() {
        if(this.props.routes.some(r => r.childrenOnly)){
            return this.props.children;
        }
        const name = this.props.location.pathname;
        return <div onDrop={prevent} onDragOver={prevent}>
            <Header loggedIn={this.props.login.loggedIn } userInfo={ this.props.userInfo }/>
                 <Notifications/>
                 <Modals />
                <div className="app-container" >
                  <ReactCSSTransitionGroup component="div" transitionName="page-transition" transitionEnterTimeout={transition} transitionLeaveTimeout={transition}>
                  <div key={name}>
                    { this.props.children }
                    </div>
                    </ReactCSSTransitionGroup>
                 </div>
            </div>
    }
}
