import { Route, Router, DefaultRoute } from 'react-router';
import React from 'react';
import App from './components/app';
import Landing from './components/landing';
import Home from './components/home';
import NotFound from './components/notFound';
import Users from './components/users';
import Roles from './components/roles';
import Documents from './components/documents';
import Document from './components/document';
import Companies from './components/companies';
import Company, { Shareholdings } from './components/company';
import Account from './components/account';
import SetPassword from './components/setPassword';
import Login from './components/login';
import SignUp from './components/signup';
import { ReduxRouter } from 'redux-router';


const routes = (
                <ReduxRouter>
                <Route component={ App }>
                <Route path="login" component={ Login }  />
                <Route path="signup" component={ SignUp }  />
                <Route path="/" component={ Landing }  />
                <Route path="home" component={ Home }  />
                <Route path="users" component={ Users }  />
                <Route path="roles" component={ Roles }  />
                <Route path="documents" component={ Documents }  />
                <Route path="document/view/:id" component={ Document }  />

                <Route path="companies" component={ Companies }  />
                <Route path="company/view/:id" component={ Company }>
                    <Route path="shareholdings" component={ Shareholdings } />
                </Route>
                <Route path="company/view/:id/history/:generation" component={ Company }  />

                <Route path="user/edit/:id" edit={true} component={ Account }  />
                <Route path="user/set_password" edit={true} component={ SetPassword }  />
                <Route path="user/create" component={ Account }  />
                <Route path="*" component={ NotFound } />
                </Route>
            </ReduxRouter>
            );


export default routes;
