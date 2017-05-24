"use strict";
import { IndexRoute, Route, Router, DefaultRoute } from 'react-router';
import React from 'react';
import App, { LoggedInApp } from './components/app';
import Home, { LandingPageView } from './components/home';
import NotFound from './components/notFound';
import Documents, { CompanyDocuments } from './components/documents';
import Document from './components/document';
import Companies, { CompaniesDelete } from './components/companies';
import Company, { CompanyDated } from './components/company';
import { Shareholders } from './components/shareholders';
import { Shareholdings } from './components/shareholdings';
import { CompanyDetails } from './components/companyDetails';
import { InterestsRegister, InterestsRegisterCreate, InterestsRegisterView } from './components/interestsRegister';
import { ShareRegister, ShareRegisterDocumentLoader } from './components/shareRegister';
import CompaniesRegister from './components/companiesRegister';
import { NewTransaction } from './components/newTransaction';
import ContactDetails, { ContactEditDetails } from './components/contactDetails';
import ReportingDetails from './components/reportingDetails';
import Directors, { DirectorRegister, DirectorRegisterDocumentLoader  } from './components/directors';
import { ShareClasses, ShareClassCreate, ShareClassEdit } from './components/shareClasses';
import RecentActivity from './components/recentActivity';
import Templates, { TemplateView, TemplateSelectCompany } from './components/templates';
import  { LoginWithCatalex } from './components/login';
import ImportCompany from './components/importCompany';
import ImportNZBN from './components/importNZBN';
import ImportMenu from './components/importMenu';
import { CompanyTransactions, PendingTransactions } from './components/transactions';
import { UpdatePeople, UpdateContact, UpdateShares, UpdateResetDelete } from './components/transactions/selection';
import { TransactionView, PendingTransactionView  } from './components/transaction';
import { MassSetup } from './components/massSetup';
import { GuidedSetup } from './components/guidedSetup';
import { CompanyAlerts } from './components/companyAlerts';
import Calendar, { CreateEvent, EditEvent } from './components/calendar';
import Alerts from './components/alerts';
import AnnualReturn, { ReviewAnnualReturn, AnnualReturnSubmission, AnnualReturnLoader, AnnualReturnSubmitted } from './components/annualReturn';
import { CompanyGraph } from './components/companyDetails';
import Account from './components/account';
import AccessList from './components/accessList';
import { CompanyHOCFromRoute, Injector } from './hoc/resources';
import { Organisation } from './components/accessList';
import CompaniesOfficeIntegration from './components/companiesOfficeIntegration';
import ErrorPage from './components/error'

const Status = (props) => {
    return <div className="container-fluid page-top">
    <div className="text-center"><h4>Good Companies is Live</h4></div>
    </div>
}


const CompanyChildren = [
    <Route name="Shareholdings" path="shareholdings" component={ Shareholdings } />,
    <Route name="Company Details" path="details" component={ CompanyDetails } />,
    <Route name="Company Transactions" path="transactions" component={ CompanyTransactions }>
        <Route name="Transaction"  path=":transactionId" component={ TransactionView }/>
    </Route>,

    <Route name="Upcoming Transactions" path="upcoming_transactions" component={ PendingTransactions }>
        <Route  name="Transaction" path=":transactionId" component={ PendingTransactionView }/>
    </Route>,

    <Route name="Shareholders" path="shareholders" component={ Shareholders } />,
    <Route name="File Cabinet" path="documents" component={ CompanyDocuments } />,
    <Route name="Document" path="documents/view/:documentId" component={ Document }  />,
    <Route name="Templates" path="templates" component={ Templates }>
        <Router path=":name" component={ TemplateView }/>
    </Route>,
    <Route name="Contact Details" path="contact" component={ ContactDetails } />,
    <Route name="Edit" path="contact/edit" component={ ContactEditDetails } />,
    <Route name="Reporting" path="reporting" component={ ReportingDetails } />,
    <Route name="Companies Register" path="source_data" component={ CompaniesRegister } />,
    <Route name="Directors" path="directors" component={ Directors } />,
    <Route name="Graph" path="graph" component={ CompanyGraph } />,
    <Route name="Access List" path="access_list" component={ AccessList } />,

    <Route name="Share Classes" path="share_classes" component={ ShareClasses } >
        <Route name="Create" path="create" component={ ShareClassCreate } />
        <Route name="View" path="view/:shareClassId" component={ ShareClassEdit } />
    </Route>,

    <Route path="registers">
        <Route name="Share Register" path="shareregister" component={ ShareRegister } />,
        <Route name="Interests Register" path="interests_register" component={ InterestsRegister } >
            <Route name="Create" path="create" component={ InterestsRegisterCreate } />
            <Route name="View" path="view/:entryId" component={ InterestsRegisterView } />
        </Route>
        <Route name="Director Register" path="director_register" component={ DirectorRegister } />

    </Route>,

    <Route name="Update" path="new_transaction" component={ NewTransaction } >
        <Route name="Contact" path="contact" component={ UpdateContact } />
        <Route name="People" path="people" component={ UpdatePeople } />
        <Route name="Shares"  path="shares" component={ UpdateShares } />
        <Route name="Reset and Delete" path="reset_delete" component={ UpdateResetDelete } />
    </Route>,
    <Route name="Guided Setup" path="guided_setup" component={ GuidedSetup } />,
    <Route name="Notifications" path="notifications" component={ CompanyAlerts } />,
    <Route name="Annual Returns" path="annual_returns" component={ AnnualReturn } />,
    <Route name="Review Annual Return" path="review_annual_return" component={ ReviewAnnualReturn } />,
    <Route name="Review Annual Submission" path="ar_details/:etag" component={ AnnualReturnSubmission } />,
    <Route name="Review Annual Submitted" path="annual_return_submitted" component={ AnnualReturnSubmitted } />,
    <Route path="*" component={ NotFound } />
];

export default (store) => {

    const requireLogin = (nextState, replace, cb) => {
        function checkAuth() {
            const { login: { loggedIn, loginUrl }} = store.getState();
            if (!loggedIn) {
                const query = encodeURIComponent(nextState.location.pathname);
                window.location.href = `${loginUrl}?next=${nextState.location.pathname}`
                cb();
            }
            else{
                cb();
            }
        }
        checkAuth();
    };


    return <Route name="Home" path="/" component={ App }>

        <Route onEnter={requireLogin} component={ LoggedInApp }>
            <Route component={ LandingPageView }>
                <IndexRoute component={ Home }  />
                <Route name="Recent Activity" path="recent_activity" component={ RecentActivity }  />
                <Route name="Calendar" path="calendar" component={ Calendar }>
                    <Route name="Create" path="create" component={ CreateEvent }/>
                    <Route name="View" path="edit/:eventId" component={ EditEvent }/>
                </Route>


                <Route name="Account Settings" path="account_settings" component={ Account }  />

                <Route name="Document" path="documents/view/:documentId" component={ Document }  />
                <Route name="Companies" path="companies" component={ Companies }  />
                <Route name="Manage Companies" path="companies/manage" component={ CompaniesDelete  }  />
                <Route name="Mass Setup" path="mass_setup" component={ MassSetup }  />
                <Route name="Import" path="import" component={ ImportMenu } />
                <Route name="Import NZBN" path="import/nzbn" component={ ImportNZBN } />
                <Route name="Import" path="import/:companyNumber" component={ ImportCompany } />
                <Route path="company/render/:id" childrenOnly={true} print={true} component={ CompanyHOCFromRoute(true)(Injector) } >
                    <Route path="share_register" component={ ShareRegisterDocumentLoader } />
                    <Route path="director_register" component={ DirectorRegisterDocumentLoader  } />
                    <Route path="annual_return" component={ AnnualReturnLoader } />
                </Route>
                <Route name="Notifications" path="alerts" component={ Alerts } />
                 <Route name="Templates" path="templates" component={ TemplateSelectCompany } >
                    <Router path=":name" component={ TemplateSelectCompany }/>
                 </Route>
                <Route name="Organisations" path="organisation" component={ Organisation } />
                <Route name="Companies Office Integration" path="companies_office_integration" component={CompaniesOfficeIntegration} />
            </Route>
            <Route name="View Company" path="company/view/:id" component={ Company } children={CompanyChildren} />
            <Route name="View Company" path="company/at_date/:date/view/:id" component={ CompanyDated } children={CompanyChildren} />
        </Route>
         <Route path='status' component={ Status } />
        <Route path="*" component={ NotFound } />
    </Route>
};
