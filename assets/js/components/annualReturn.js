"use strict";
import React from 'react';
import STRINGS from '../strings';
import LawBrowserContainer from './lawBrowserContainer'
import LawBrowserLink from './lawBrowserLink';

function ARLinks() {
    return <div>
        <LawBrowserLink title="Companies Act 1993" location="s 214(1)+(6)+(7)">Board to file annual return</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 214(2)">Date of annual return</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 214(3)">Annual return to be signed</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 214(4),(5)">Annual return filing month</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 214(8),(9)">Special form of annual return</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 214(10) and 374(2)(23)">Consequences of non-compliance</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993 Regulations 1994" location="sch 1 cl 12">Form of annual return</LawBrowserLink>
        </div>
}

export default class AnnualReturn extends React.Component {
    render() {
        return <LawBrowserContainer lawLinks={ARLinks()}>
            <div className="widget">
                <div className="widget-header">
                    <div className="widget-title">
                        Annual Returns
                    </div>
                </div>
                <div className="widget-body">
                <p>Annual returns can be filed through the Companies Office website using a RealMe login. Click <a className="external-link" rel="noopener noreferrer" href="https://www.companiesoffice.govt.nz/companies/app/ui/pages/companies/fileAnnualReturn" target="_blank">here</a> for more information.</p>
                <p>We are currently working with the Companies Office to create an API that will allow annual returns to be filed through Good Companies. The Companies Office is confident the API will be available from March 2017. Click <a rel="noopener noreferrer" className="external-link" href="https://www.companiesoffice.govt.nz/companies/news-updates/news/companies-office-develops-new-service">here</a> for more information.</p>
                </div>
            </div>
        </LawBrowserContainer>
    }
}