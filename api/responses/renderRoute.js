"use strict"
import React from 'react'
import createLocation from 'history/lib/createLocation'
import { renderToString } from 'react-dom/server'
import routes from '../../assets/js/routes';
import configureStore from '../../assets/js/store.prod';
import Root from '../../assets/js/root';
import { Provider } from 'react-redux';
import { match } from 'react-router';
import { createMemoryHistory } from 'react-router'
import { loadOnServer } from 'redux-async-connect';
import { setFetch } from "../../assets/js/utils";
import fetch from 'isomorphic-fetch';

module.exports = function(renderProps) {

    if(sails.config.serverRender){
        const req = this.req,
            res = this.res,
            state = {login: {loggedIn: req.isAuthenticated()}, userInfo: req.user ? {...req.user.toJSON(), _status: 'complete'} : {}},
            // state = {login: {loggedIn: req.isAuthenticated()}},
            history = createMemoryHistory(req.url),
            store = configureStore(history, state);
        const url = req.url;

        setFetch(function(url, args){
            url = 'http://localhost:'+sails.config.port+url;
            return fetch(url, _.merge(args, {headers: _.merge(args.headers, {'Cookie': req.get('cookie')})}))
        })

        match({history, routes: routes(store), location: url}, (error, redirectLocation, renderProps) => {
            if (error) {
                res.send(500, error.message)
            }

            else if (redirectLocation) {
                res.redirect(301, redirectLocation.pathname + redirectLocation.search)
            }
            else {
                loadOnServer({...renderProps, store}).then(() => {
                    res.status(200);
                    const output = renderToString(<Root store={store} history={history}/>);
                    res.render('content.ejs', { reactOutput: output, data: JSON.stringify(store.getState()),  _layoutFile: 'layout.ejs'});
                });
            }
        });
    }
    else{
        this.res.render('content.ejs', { reactOutput: '', data: JSON.stringify(
                        {login: {loggedIn: this.req.isAuthenticated()}}),  _layoutFile: 'layout.ejs'});
    }
}