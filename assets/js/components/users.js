"use strict";
import React from 'react';
import {requestResource} from '../actions';
import pureRender from 'pure-render-decorator';
import { connect } from 'react-redux';


@pureRender
@connect(state => state.resources.users)
export default class Users extends React.Component {

    componentDidMount(){
        this.props.dispatch(requestResource('users'));
    }

    componentDidUpdate(){
        this.props.dispatch(requestResource('users'));
    }

    render() {
        return <div>Here</div>
    }
}

