import React from 'react';
import { pureRender } from '../utils';
import { connect } from 'react-redux';
import DropZone from 'react-dropzone';
import { hideNotification } from '../actions'
import AuthenticatedComponent from  './authenticated';


@pureRender
class Notification extends React.Component {
    static propTypes = { notification: React.PropTypes.object.isRequired };

    render(){
        return <div className="alert alert-success notification" role="alert" onClick={this.props.close}>
            { this.props.notification.message }
        </div>
    }
}


@AuthenticatedComponent
@connect(state => state.notifications)
export default class Notifications extends React.Component {
    static propTypes = { list: React.PropTypes.array.isRequired };
    close(index){
        this.props.dispatch(hideNotification(index));
    }
    render(){
        console.log("RENDER Notification")
       return  <div className="notifications">
            { this.props.list.map((n, i) => <Notification key={i} notification={n} close={this.close.bind(this, i)} />)}
        </div>
    }
}