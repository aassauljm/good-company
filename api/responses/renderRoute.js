"use strict"
import React from 'react'
import createLocation from 'history/lib/createLocation'
import {renderToString } from 'react-dom/server'
import routes from '../../assets/js/routes';
import configureStore from '../../assets/js/serverStore';
import Root from '../../assets/js/root';
import { Provider } from 'react-redux';
import { RoutingContext, match } from 'react-router';
import { createMemoryHistory } from 'react-router'

export default function(renderProps) {
    if(sails.config.serverRender){
        const req = this.req,
            res = this.res,
            state = {login: {loggedIn: req.isAuthenticated()}, userInfo: req.user ? {...req.user.toJSON(), _status: 'complete'} : {}},
            store = configureStore(state);
        match({routes, location: req.url}, (error, redirectLocation, renderProps) => {
            if (error || !renderProps) {
                res.send(500, error.message)
            }

            if (redirectLocation) {
                res.redirect(301, redirectLocation.pathname + redirectLocation.search)
            }
            res.status(200);
            const output = renderToString(
                                          <Root store={store} history={createMemoryHistory(req.url)}/>);
            res.render('content.ejs', { reactOutput: output, data: JSON.stringify(store.getState()),  _layoutFile: 'layout.ejs'});
        });
    }
    else{
        this.res.render('content.ejs', { reactOutput: '', data: JSON.stringify(
                        {login: {loggedIn: this.req.isAuthenticated()}}),  _layoutFile: 'layout.ejs'});
    }
}