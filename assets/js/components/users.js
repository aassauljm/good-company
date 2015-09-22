"use strict";
import React from 'react';
import Actions from '../actions';
import pureRender from 'pure-render-decorator';

@pureRender
export default class Users extends React.Component {
    componentDidMount(){
        this.fetch();
    }

    componentDidUpdate(){
        this.fetch();
    }

    fetch(){
        if(!this.props.users){
            Actions.fetchResource('users');
        }
    }

    render() {
        return  <div/>
    }
}

