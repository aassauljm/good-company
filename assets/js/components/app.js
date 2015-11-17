import React from 'react';
import Header from './header';
import Login from './login';
import { pureRender } from '../utils';
import { connect } from 'react-redux';
import { requestUserInfo } from '../actions';
import { pushState, replaceState } from 'redux-router';
import DropZone from 'react-dropzone';
import { createResource } from '../actions'
import Notifications from './notifications';
import Modals from './modals';


@connect(state => { return {login: state.login, userInfo: state.userInfo} })
export default class App extends React.Component {

    componentDidMount(){
        this.props.dispatch(requestUserInfo())
    }

    componentDidUpdate(){
        this.props.dispatch(requestUserInfo())
    }

    onDrop(files){
        let form = new FormData()
        form.append('document', files[0], files[0].name)
        this.props.dispatch(createResource('/document/upload_document', form, null, false))
            .then(function(){
                // show upload notification
            })
    }

    render() {
        return  <div>
            <Header loggedIn={this.props.login.loggedIn } userInfo={ this.props.userInfo }/>
                <DropZone  onDrop={::this.onDrop} disableClick={true} style={{}}>
             <Notifications/>
             <Modals />
            <div className="container">
                { this.props.children }
             </div>
            </DropZone>
        </div>
    }
}
