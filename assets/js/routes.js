import { Route, Router, DefaultRoute } from 'react-router';
import React from 'react';
import App from './components/app';
import Landing from './components/landing';
import Home from './components/home';
import Users from './components/users';


export default
    <Router>
        <Route component={ App }>
            <Route path="/" component={ Landing }  />
            <Route path="/home" component={ Home }  />
            <Route path="/users" component={ Users }  />
        </Route>
    </Router>
