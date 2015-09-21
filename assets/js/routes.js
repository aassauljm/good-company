import { Route, Router, DefaultRoute } from 'react-router';
import React from 'react';
import App from './components/app';
import Landing from './components/landing';
import Home from './components/home';





export default
    <Router>
        <Route component={ App }>
            <Route path="/" component={ Landing }  />
            <Route path="home" component={ Home }  />
        </Route>
    </Router>
