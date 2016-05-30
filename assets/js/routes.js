"use strict";
import { IndexRoute, Route, Router, DefaultRoute } from 'react-router';
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
import Company, { CompanyTransactions, CompanyLoader } from './components/company';
import { Shareholders } from './components/shareholders';
import { Shareholdings } from './components/shareholdings';
import { CompanyDetails } from './components/companyDetails';
import { InterestsRegister, InterestsRegisterCreate, InterestsRegisterView } from './components/interestsRegister';
import { ShareRegister, ShareRegisterDocumentLoader } from './components/shareRegister';
import { NewTransaction } from './components/newTransaction';
import ContactDetails  from './components/contactDetails';
import { ShareClasses, ShareClassCreate, ShareClassView } from './components/shareClasses';
import RecentActivity from './components/recentActivity';
import Templates from './components/templates';
import Account from './components/account';
import SetPassword from './components/setPassword';
import Login from './components/login';
import SignUp from './components/signup';


export default (store) => {
    const requireLogin = (nextState, replace, cb) => {
        function checkAuth() {
            const { login: { loggedIn }} = store.getState();
            if (!loggedIn) {
                replace('/login');
            }
            cb();
        }
        checkAuth();
    };


    return <Route path="/" component={ App }>
        <Route path="login" component={ Login }  />
        <Route path="signup" component={ SignUp }  />
        <Route onEnter={requireLogin}>
            <IndexRoute component={ Home }  />
            <Route path="home" component={ Home }  />
            <Route path="recent_activity" component={ RecentActivity }  />
            <Route path="users" component={ Users }  />
            <Route path="roles" component={ Roles }  />
            <Route path="documents" component={ Documents }  />
            <Route path="document/view/:id" component={ Document }  />
            <Route path="companies" component={ Companies }  />
            <Route path="company/view/:id" component={ Company } childrenOnly={true}>
                <Route path="shareholdings" component={ Shareholdings } />
                <Route path="details" component={ CompanyDetails } />
                <Route path="transactions" component={ CompanyTransactions } />
                <Route path="new_transaction" component={ NewTransaction } />
                <Route path="shareregister" component={ ShareRegister } />
                <Route path="shareholders" component={ Shareholders } />
                <Route path="documents" component={ CompanyDocuments } />
                <Route path="templates" component={ Templates } />
                <Route path="contact" component={ ContactDetails } />
                <Route path="share_classes" component={ ShareClasses } >
                    <Route path="create" component={ ShareClassCreate } />
                    <Route path="view/:shareClassId" component={ ShareClassView } />
                </Route>
                <Route path="interests_register" component={ InterestsRegister } >
                    <Route path="create" component={ InterestsRegisterCreate } />
                    <Route path="view/:entryId" component={ InterestsRegisterView } />
                </Route>
            </Route>
            <Route path="company/view/:id/history/:generation" component={ Company }  />
            <Route path="user/edit/:id" component={ Account }  edit={true} />
            <Route path="user/set_password" component={ SetPassword } edit={true} />
            <Route path="user/create" component={ Account }  />
        </Route>
        <Route path="company/render/:id" component={ CompanyLoader } childrenOnly={true} print={true}>
            <Route path="shareregister" component={ ShareRegisterDocumentLoader } />
        </Route>
        <Route path="*" component={ NotFound } />
    </Route>;
};
