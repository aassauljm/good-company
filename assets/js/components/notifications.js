import React from 'react';
import { pureRender } from '../utils';
import { connect } from 'react-redux';
import DropZone from 'react-dropzone';
import { hideNotification, addNotification } from '../actions'
import ReactCSSTransitionGroup from 'react/lib/ReactCSSTransitionGroup';
const NOTIFICATION_TIMEOUT = 5000;


@pureRender
class Notification extends React.Component {
    static propTypes = { notification: React.PropTypes.object.isRequired };

    componentDidMount() {
        this._timeout = setTimeout(() => {
            this.props.close();
        }, NOTIFICATION_TIMEOUT);
    }

    componentWillUnmount() {
        clearTimeout(this._timeout);
    }

    render(){
        const type = this.props.notification.error ? 'alert-danger' : 'alert-success';
        return <div className={"alert notification " +type} role="alert" onClick={this.props.close}>
        <div className="small-logo"/><span> { this.props.notification.message }</span>
        </div>
    }
}


@connect(state => state.notifications)
export default class Notifications extends React.Component {
    static propTypes = { list: React.PropTypes.array.isRequired };
    close(index){
        this.props.dispatch(hideNotification(index));<img src="/build/images/law-browser-sml.png" />
    }

    render(){
       return  <div className="notifications">
       <ReactCSSTransitionGroup
          transitionName="notification-animation"
          transitionEnterTimeout={500}
          transitionLeaveTimeout={100}
          transitionAppear={true}
            transitionAppearTimeout={300}>
            { this.props.list.map((n, i) => <Notification key={i} notification={this.props.list[this.props.list.length - 1 - i]} close={() => this.close(i)} /> ) }
        </ReactCSSTransitionGroup>
        </div>
    }
}