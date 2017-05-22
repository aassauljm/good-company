import React from 'react';
import Header from './header';
import { pureRender } from '../utils';
import { requestUserInfo } from '../actions';
import { createResource, mounted } from '../actions'
import Notifications from './notifications';
import Modals from './modals';
import Search from './search';
import ReactCSSTransitionGroup from 'react/lib/ReactCSSTransitionGroup';
import { asyncConnect } from 'redux-connect';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext, DropTarget } from 'react-dnd';
import { POPOVER_DRAGGABLE } from './lawBrowserLink';
import Promise from 'bluebird';
import { connect } from 'react-redux';
import { AsyncHOCFactory, ALERTS, COMPANIES } from '../hoc/resources';
import UserFeedback from './userFeedback';


function prevent(e){
    e.preventDefault();
    e.stopPropagation();
}

const transition = __SERVER__ ? 0 : 200;


@DropTarget(POPOVER_DRAGGABLE, {
  drop(props, monitor, component) {
    monitor.getItem().updatePosition(monitor.getDifferenceFromInitialOffset());
  }
}, (connect, monitor) => ({
    connectDropTarget: connect.dropTarget()
}))
export class DragContainer extends React.Component {
    render(){
        return this.props.connectDropTarget(<div className="drop-container">{this.props.children}</div>);
    }
}


@asyncConnect([{
  promise: ({store: {dispatch, getState}}) => {
    const promises = [];
    promises.push(dispatch(requestUserInfo()))
    return Promise.all(promises);
  }
}])
@DragDropContext(HTML5Backend)
export default class App extends React.Component {
    render() {
        console.log(this.props);
        if(this.props.routes.some(r => r.childrenOnly)){
            return <div onDragOver={prevent}>
             <DragContainer>
                    <Modals />
                { this.props.children }
                </DragContainer>
            </div>
        }
        let name = this.props.location.pathname;
        name = name.split('/')[1] || 'root'
        return <div>
            <Header />
                 <Notifications />
                 <Modals />
                  <DragContainer>
                <div className="app-container" >
                  <ReactCSSTransitionGroup component="div" transitionName="page-transition" transitionEnterTimeout={transition} transitionLeaveTimeout={transition}>
                    <div key={name}>
                        { this.props.children }
                    </div>

                    <UserFeedback
                        style={{
                            textAlign: 'center',
                            marginBottom: '15px'
                        }} />
                    </ReactCSSTransitionGroup>
                 </div>
                 </DragContainer>
            </div>
    }
}




@AsyncHOCFactory([ALERTS, COMPANIES])
@connect(undefined, {
    mounted: () => mounted()
})
export class LoggedInApp extends React.Component {
    componentDidMount() {
        this.props.mounted();
    }
    render() {
        return this.props.children
    }
}
