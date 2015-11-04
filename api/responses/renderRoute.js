"use strict"
import React from 'react'
import createLocation from 'history/lib/createLocation'
import {renderToString } from 'react-dom/server'
import routes from '../../assets/js/routes';
import configureStore from '../../assets/js/serverStore';
import Root from '../../assets/js/root';
import { match } from 'redux-router/server';
import { Provider } from 'react-redux';


export default function(renderProps) {
    const req = this.req,
        res = this.res,
        state = {login: {loggedIn: req.isAuthenticated()}, userInfo: req.user ? {...req.user.toJSON(), _status: 'complete'} : {}},
        store = configureStore(state);
    store.dispatch(match(req.url, (error, redirectLocation, routerState) => {
        if (error) {
            res.send(500, error.message)
        }

        if (redirectLocation) {
            res.redirect(301, redirectLocation.pathname + redirectLocation.search)
        }

        if (!routerState) {
            //res.send(404, 'Not found')
        }

        res.status(200);
        const output = renderToString(<Root store={store}/>);
        res.render('content.ejs', { reactOutput: output, data: JSON.stringify(state),  _layoutFile: 'layout.ejs'});
    }));
}