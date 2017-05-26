import React from 'react';
import PropTypes from 'prop-types';
import { pureRender } from '../utils';
import { connect } from 'react-redux';
import { hideNotification, addNotification } from '../actions'
import ReactCSSTransitionGroup from 'react/lib/ReactCSSTransitionGroup';

const NOTIFICATION_TIMEOUT = 7000;


@pureRender
class Notification extends React.PureComponent {
    static propTypes = { notification: PropTypes.object.isRequired };

    componentDidMount() {
        this._timeout = setTimeout(() => {
            this.props.close(this.props.notification.notificationId);
        }, NOTIFICATION_TIMEOUT);
    }

    componentWillUnmount() {
        clearTimeout(this._timeout)
    }

    render(){
        const type = this.props.notification.error ? 'alert-danger' : 'alert-success';
        return <div className={"alert notification " +type} role="alert" onClick={() => this.props.close(this.props.notification.notificationId)}>
        <div className="small-logo" /><div>{ this.props.notification.message } </div>
        </div>
    }
}


@connect(state => state.notifications)
export default class Notifications extends React.PureComponent {

    static propTypes = {
        list: PropTypes.array.isRequired
    };

    constructor(props) {
        super();
        this.close = ::this.close;
    }

    close(index) {
        this.props.dispatch(hideNotification(index));
    }

    render() {
       return  <div className="notifications">
       <ReactCSSTransitionGroup
            transitionName="notification-animation"
            transitionEnterTimeout={500}
            transitionLeaveTimeout={100}
            transitionAppear={true}
            transitionAppearTimeout={300}>
            { this.props.list.map((n, i) => {
                const index = this.props.list.length - 1 - i;
                return <Notification
                key={this.props.list[index].notificationId}
                notification={this.props.list[index]}
                close={this.close}
              /> })
            }
        </ReactCSSTransitionGroup>
        </div>
    }
}