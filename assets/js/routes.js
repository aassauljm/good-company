import { Route, Router, DefaultRoute } from 'react-router';
import React from 'react';
import App from './components/app';
import Landing from './components/landing';
import Home from './components/home';
import Users from './components/users';
import Roles from './components/roles';
import Account from './components/account';
import SetPassword from './components/setPassword';
import Login from './components/login';
import SignUp from './components/signup';

import { ReduxRouter } from 'redux-router';

const routes = (<ReduxRouter>
                <Route component={ App }>
                <Route path="login" component={ Login }  />
                <Route path="signup" component={ SignUp }  />
                <Route path="/" component={ Landing }  />
                <Route path="home" component={ Home }  />
                <Route path="users" component={ Users }  />
                <Route path="roles" component={ Roles }  />
                <Route path="user/edit/:id" edit={true} component={ Account }  />
                <Route path="user/set_password" edit={true} component={ SetPassword }  />
                <Route path="user/create" component={ Account }  />
                </Route>
            </ReduxRouter>);


export default routes;
