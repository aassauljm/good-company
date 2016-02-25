"use strict";
import { Route, Router, DefaultRoute } from 'react-router';
import React from 'react';
import App from './components/app';
import Landing from './components/landing';
import Home from './components/home';
import NotFound from './components/notFound';
import Users from './components/users';
import Roles from './components/roles';
import Documents, { CompanyDocuments } from './components/documents';
import Document from './components/document';
import Companies from './components/companies';
import Company, { Shareholdings, CompanyDetails, CompanyTransactions, Shareholders } from './components/company';
import { InterestsRegister, InterestsRegisterCreate } from './components/interestsRegister';
import { ShareRegister } from './components/shareRegister';
import { NewTransaction } from './components/newTransaction';
import Account from './components/account';
import SetPassword from './components/setPassword';
import Login from './components/login';
import SignUp from './components/signup';


const routes = (
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
            <Route path="details" component={ CompanyDetails } />
            <Route path="transactions" component={ CompanyTransactions } />
            <Route path="new_transaction" component={ NewTransaction } />
            <Route path="shareregister" component={ ShareRegister } />
            <Route path="shareholders" component={ Shareholders } />
            <Route path="documents" component={ CompanyDocuments } />
            <Route path="interests_register" component={ InterestsRegister } >
                <Route path="create" component={ InterestsRegisterCreate } />
            </Route>
        </Route>
        <Route path="company/view/:id/history/:generation" component={ Company }  />
        <Route path="user/edit/:id" edit={true} component={ Account }  />
        <Route path="user/set_password" edit={true} component={ SetPassword }  />
        <Route path="user/create" component={ Account }  />
        <Route path="*" component={ NotFound } />
    </Route>);


export default routes;
