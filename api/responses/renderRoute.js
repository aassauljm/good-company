"use strict"
import React from 'react'
import createLocation from 'history/lib/createLocation'
import {renderToString } from 'react-dom/server'
import routes from '../../assets/js/routes';
import configureStore from '../../assets/js/serverStore';
import { match } from 'redux-router/server';
import { Provider } from 'react-redux';


export default function(renderProps) {
    let req = this.req;
    let res = this.res;
   //let location = createLocation(req.url)
    const state = {login: {loggedIn: req.isAuthenticated()}};
    const store = configureStore(state);
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

        class Root extends React.Component {
          render() {
            return (
              <Provider store={store}>
                { routes }
                </Provider>
            );
          }
        }
        res.status(200);
        const output = renderToString(<Root/>);
        res.render('content.ejs', { reactOutput: output, data: JSON.stringify(state),  _layoutFile: 'layout.ejs'});


    }));
}