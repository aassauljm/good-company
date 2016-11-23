import React from 'react';
import Header from './header';
import Login from './login';
import { pureRender } from '../utils';
import { requestUserInfo } from '../actions';
import { createResource } from '../actions'
import Notifications from './notifications';
import Modals from './modals';
import Search from './search';
import ReactCSSTransitionGroup from 'react/lib/ReactCSSTransitionGroup';
import { asyncConnect } from 'redux-connect';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext, DropTarget } from 'react-dnd';
import { POPOVER_DRAGGABLE } from './lawBrowserLink';
import Promise from 'bluebird';




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
                    </ReactCSSTransitionGroup>
                 </div>
                 </DragContainer>
            </div>
    }
}

@pureRender
export class LoggedInApp extends React.Component {
    render() {
        if(this.props.routes.some(r => r.childrenOnly)){
            return <div>
                { this.props.children }
            </div>
        }
        return  <div>
            <div className="container-fluid page-top">
                <div className="container">
                    <Search />
                </div>
            </div>
                <div className="container-fluid page-body">
                        { this.props.children }
                </div>
        </div>
    }
}
