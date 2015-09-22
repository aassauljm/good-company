"use strict";
import Reflux from 'reflux';
import request from 'superagent-bluebird-promise'
import Actions from '../actions';
import _ from 'lodash';


Actions.userInfo.listen(function(credentials){
    request
        .post('/get_info', credentials)
        .then(Actions.userInfo.success)
        .catch(Actions.userInfo.failure)
})

export default Reflux.createStore({
    init: function() {
        this.listenToMany(Actions);
    },
    getInitialState: function(){
        return {}
    },
    onSetUserInfo: function(data){
        this.data = _.defaults(data, this.getInitialState());
        this.update();
    },
    onUserInfoSuccess: function(data){
        this.data = data.body;
        // trigger nav
        this.update();
    },
    onUserInfoFailure: function(e){
        this.data = {};
        this.update();
    },
    update: function(){
        this.trigger(this.data);
    }
});