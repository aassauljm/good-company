import React from 'react';
import { pureRender } from '../utils';
import { connect } from 'react-redux';
import DropZone from 'react-dropzone';
import { hideNotification } from '../actions'
import ReactCSSTransitionGroup from 'react/lib/ReactCSSTransitionGroup';

const NOTIFICATION_TIMEOUT = 10000;


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
            { this.props.notification.message }
        </div>
    }
}


@connect(state => state.notifications)
export default class Notifications extends React.Component {
    static propTypes = { list: React.PropTypes.array.isRequired };
    close(index){
        this.props.dispatch(hideNotification(index));
    }
    render(){
       return  <div className="notifications container">
        <ReactCSSTransitionGroup transitionName="notifications" transitionLeaveTimeout={500} transitionEnterTimeout={500} >
            { this.props.list.map((n, i) => <Notification key={i} notification={n} close={this.close.bind(this, i)} />)}
            </ReactCSSTransitionGroup>
        </div>
    }
}