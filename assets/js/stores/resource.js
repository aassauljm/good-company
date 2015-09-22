"use strict";
import Reflux from 'reflux';
import request from 'superagent-bluebird-promise'
import Actions from '../actions';
import _ from 'lodash';

let urls = {
    'users': '/user',
    'companies': '/company'
}


Actions.fetchResource.listen(function(resource){
    request
        .get(urls[resource])
        .then(Actions.fetchResource.success)
        .catch(Actions.fetchResource.failure)
})

export default Reflux.createStore({
    init: function() {
        this.listenToMany(Actions);
    },
    getInitialState: function(){
        return {}
    },
    onSetResource: function(resource, data){
        this.data = _.defaults(data, this.getInitialState());
        this.update();
    },
    onResourceSuccess: function(resource, response){
        this.data[resource] = _.defaults(response.body, this.getInitialState());
        // trigger nav
        this.update();
    },
    onLoginFailure: function(e){
        this.data[resource] = []
        this.update();
    },
    update: function(){
        this.trigger(this.data);
    }
});