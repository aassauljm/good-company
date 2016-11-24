"use strict";
import { IndexRoute, Route, Router, DefaultRoute } from 'react-router';
import React from 'react';
import App, { LoggedInApp } from './components/app';
import Landing from './components/landing';
import Home from './components/home';
import NotFound from './components/notFound';
import Users from './components/users';
import Roles from './components/roles';
import Favourites from './components/favourites';
import Documents, { CompanyDocuments } from './components/documents';
import Document from './components/document';
import Companies from './components/companies';
import Company, { CompanyLoader } from './components/company';
import { Shareholders } from './components/shareholders';
import { Shareholdings } from './components/shareholdings';
import { CompanyDetails } from './components/companyDetails';
import { InterestsRegister, InterestsRegisterCreate, InterestsRegisterView } from './components/interestsRegister';
import { ShareRegister, ShareRegisterDocumentLoader } from './components/shareRegister';
import CompaniesRegister from './components/companiesRegister';
import { NewTransaction } from './components/newTransaction';
import ContactDetails from './components/contactDetails';
import ReportingDetails from './components/reportingDetails';
import Directors from './components/directors';
import { ShareClasses, ShareClassCreate, ShareClassEdit } from './components/shareClasses';
import RecentActivity from './components/recentActivity';
import Templates, { TemplateView } from './components/templates';
import  { LoginWithCatalex } from './components/login';
import ImportCompany from './components/importCompany';
import ImportMenu from './components/importMenu';
import { CompanyTransactions } from './components/transactions';
import { UpdatePeople, UpdateContact, UpdateShares, UpdateResetDelete } from './components/transactions/selection';
import { TransactionView } from './components/transaction';
import { MassSetup } from './components/massSetup';
import { GuidedSetup } from './components/guidedSetup';
import { CompanyAlerts } from './components/companyAlerts';
import Calendar, { CreateEvent, EditEvent } from './components/calendar';
import Alerts from './components/alerts';
import AnnualReturn from './components/annualReturn';



export default (store) => {

    const requireLogin = (nextState, replace, cb) => {
        function checkAuth() {
            const { login: { loggedIn, loginUrl }} = store.getState();
            if (!loggedIn) {
                replace('/login');
                cb();
            }
            else{
                cb();
            }
        }
        checkAuth();
    };


    return <Route path="/" component={ App }>
        <Route path="login" component={ LoginWithCatalex }  />
        <Route onEnter={requireLogin} component={ LoggedInApp }>
            <IndexRoute component={ Home }  />
            <Route path="recent_activity" component={ RecentActivity }  />
            <Route path="calendar" component={ Calendar }>
                <Route path="create" component={ CreateEvent }/>
                <Route path="edit/:eventId" component={ EditEvent }/>
            </Route>
            <Route path="users" component={ Users }  />
            <Route path="roles" component={ Roles }  />
            <Route path="documents" component={ Documents }  />
            <Route path="documents/view/:documentId" component={ Document }  />
            <Route path="companies" component={ Companies }  />
            <Route path="mass_setup" component={ MassSetup }  />
            <Route path="company/view/:id" component={ Company } childrenOnly={true}>
                <Route path="shareholdings" component={ Shareholdings } />
                <Route path="details" component={ CompanyDetails } />
                <Route path="transactions" component={ CompanyTransactions }>
                    <Route path=":transactionId" component={ TransactionView }/>
                </Route>
                <Route path="shareregister" component={ ShareRegister } />
                <Route path="shareholders" component={ Shareholders } />
                <Route path="documents" component={ CompanyDocuments } />
                <Route path="document/view/:documentId" component={ Document }  />
                <Route path="templates" component={ Templates }>
                    <Router path=":name" component={ TemplateView }/>
                </Route>
                <Route path="contact" component={ ContactDetails } />
                <Route path="reporting" component={ ReportingDetails } />
                <Route path="source_data" component={ CompaniesRegister } />
                <Route path="directors" component={ Directors } />
                <Route path="share_classes" component={ ShareClasses } >
                    <Route path="create" component={ ShareClassCreate } />
                    <Route path="view/:shareClassId" component={ ShareClassEdit } />
                </Route>
                <Route path="interests_register" component={ InterestsRegister } >
                    <Route path="create" component={ InterestsRegisterCreate } />
                    <Route path="view/:entryId" component={ InterestsRegisterView } />
                </Route>
                <Route path="new_transaction" component={ NewTransaction } >
                    <Route path="contact" component={ UpdateContact } />
                    <Route path="people" component={ UpdatePeople } />
                    <Route path="shares" component={ UpdateShares } />
                    <Route path="reset_delete" component={ UpdateResetDelete } />
                </Route>
                <Route path="guided_setup" component={ GuidedSetup } />
                <Route path="notifications" component={ CompanyAlerts } />
                <Route path="annual_returns" component={ AnnualReturn } />
              <Route path="*" component={ NotFound } />
            </Route>
            <Route path="company/view/:id/history/:generation" component={ Company }  />
            <Route path="import" component={ ImportMenu } />
            <Route path="import/:companyNumber" component={ ImportCompany } />
            <Route path="company/render/:id" component={ CompanyLoader } childrenOnly={true} print={true}>
                <Route path="shareregister" component={ ShareRegisterDocumentLoader } />
            </Route>
            <Route path="favourites" component={ Favourites } />
            <Route path="alerts" component={ Alerts } />
            <Route path="annual_returns" component={ AnnualReturn } />
             <Route path="templates" component={ Templates }>
                <Router path=":name" component={ TemplateView }/>
            </Route>
        </Route>
        <Route path="*" component={ NotFound } />
    </Route>
};
