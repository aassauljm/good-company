"use strict";
import Reflux from 'reflux';
import { Socket } from '../util'
import Login from './login';
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
    },
    getInitialState: function() {
        return this.app;
    },
    loadData: function(data) {
        Actions.setLogin(data.login);
        Actions.setLoggedIn(data.loggedIn);

    },
    onLogin: function(data) {
       this.app.login = data;
       this.update();
    },
    onLoggedIn: function(data) {
       this.app.loggedIn = data;
       this.update();
    },
    update: function(){
        console.log('Master', this.app);
        this.trigger(this.app);
    }
});