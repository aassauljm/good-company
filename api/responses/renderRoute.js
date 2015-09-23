"use strict"
import React from 'react'
import createLocation from 'history/lib/createLocation'
import { RoutingContext, match } from 'react-router'
import { renderToString } from 'react-dom/server'
import routes from '../../assets/js/routes';


export default function(renderProps){
    let req = this.req;
    let res = this.res;
    let location = createLocation(req.url)
    res.render('content.ejs', { reactOutput: null, data: JSON.stringify({login: {loggedIn: req.isAuthenticated()}}),  _layoutFile: 'layout.ejs'});
    return;

    match({ routes, location }, (error, redirectLocation, renderProps) => {
        if (redirectLocation){
            res.redirect(301, redirectLocation.pathname + redirectLocation.search)
        }
        else if (error){
            res.send(500, error.message)
        }
        else if (renderProps == null){
            res.send(404, 'Not found')
        }
        else{
            let output = null;
            //output = renderToString(<RoutingContext {...renderProps}/>);
            res.render('content.ejs', { reactOutput: output, data: JSON.stringify({login: {loggedIn: req.isAuthenticated()}}),  _layoutFile: 'layout.ejs'});
        }
    })
}