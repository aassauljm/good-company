"use strict";
import Reflux from 'reflux';
import request from 'superagent-bluebird-promise'
import Actions from '../actions';
import _ from 'lodash';


Actions.login.listen(function(credentials){
    request
        .post('/auth/local', credentials)
        .then(Actions.login.success)
        .catch(Actions.login.failure)
})

export default Reflux.createStore({
    init: function() {
        this.listenToMany(Actions);
    },
    getInitialState: function(){
        return {error: null}
    },
    onSetLogin: function(data){
        this.data = _.defaults(data, this.getInitialState());
        this.update();
    },
    onLogin: function(credentials) {
        // some sort of loading
    },
    onLoginSuccess: function(){
        this.data = {};
        // trigger nav
        this.update();
    },
    onLoginFailure: function(e){
        this.data = {error: {message: 'Invalid credentials'}};
        this.update();
    },
    update: function(){
        this.trigger(this.data);
    }
});