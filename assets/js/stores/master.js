"use strict";
import Reflux from 'reflux';
import { Socket } from '../util'
import Login from './login';
import UserInfo from './user_info';
import Resource from './resource';
import Actions from '../actions';


let LoggedIn = Reflux.createStore({
    init: function() {
        this.listenToMany(Actions);
    },
    getInitialState: function(){
        return this.data;
    },
    onLoginSuccess: function(){
        this.data = true;
        this.update();
    },
    onSetLoggedIn: function(state){
        this.data = state;
        this.update();
    },
    update: function(){
        this.trigger(this.data);
    }
});

export default Reflux.createStore({
    init: function() {
        this.app = {login: Login.getInitialState()}
        this.listenTo(Login, this.onLogin);
        this.listenTo(LoggedIn, this.onLoggedIn);
        this.listenTo(UserInfo, this.onUserInfo);
        this.listenTo(Resource, this.onResource);
    },
    getInitialState: function() {
        return this.app;
    },
    loadData: function(data) {
        Actions.setLogin(data.login);
        Actions.setLoggedIn(data.loggedIn);
        Actions.setResources(data.resources);
    },
    onLogin: function(data) {
       this.app.login = data;
       this.update();
    },
    onLoggedIn: function(data) {
       this.app.loggedIn = data;
       this.update();
    },
    onUserInfo: function(data) {
       this.app.userInfo = data;
       this.update();
    },
    onResource: function(data) {
       this.app.resources = data;
       this.update();
    },
    update: function(){
        console.log('Master', this.app);
        this.trigger(this.app);
    }
});