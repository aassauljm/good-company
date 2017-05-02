"use strict";
import React from 'react';
import STRINGS from '../strings';
import LawBrowserContainer from './lawBrowserContainer'
import LawBrowserLink from './lawBrowserLink';
import { Link } from 'react-router';
import { AnnualReturnHOC,  AnnualReturnFromRouteHOC } from '../hoc/resources';
import { stringDateToFormattedString, numberWithCommas } from '../utils';
import moment from 'moment';

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

const ARSummary = (props) => {
    const leftColumn = 'col-md-4 left';
    const rightColumn = 'col-md-8 right';
    const row = "row";
    const titleRow = "row title-row";
    const condensedRow = "row";
    return <div className="annual-return">
            <h4 className="text-center">Annual Return</h4>


        <div className={ row }>
            <div className={ leftColumn }>
                { STRINGS.companyName }
            </div>
            <div className={ rightColumn }>
                { props.company.companyName }
            </div>
        </div>

        <div className={ row }>
            <div className={ leftColumn }>
                { STRINGS.nzbn }
            </div>
            <div className={ rightColumn }>
                { props.company.nzbn }
            </div>
        </div>

        <div className={ row }>
            <div className={ leftColumn }>
                { STRINGS.effectiveDate }
            </div>
            <div className={ rightColumn }>
                { moment().format('D MMM YYYY') }
            </div>
        </div>

        <div className={ row }>
            <div className={ leftColumn }>
                Filing Year
            </div>
            <div className={ rightColumn }>
                { (new Date()).getFullYear() }
            </div>
        </div>

        <div className={ row }>
            <div className={ leftColumn }>
                 { STRINGS.ultimateHoldingCompany }
            </div>
            <div className={ rightColumn }>
                { props.company.ultimateHoldingCompany ? 'Yes' : 'No' }
            </div>
        </div>

        <div className={ titleRow }>
            <div className={ leftColumn }>
                 Required Addresses
            </div>
        </div>

        <div className={ row }>
            <div className={ leftColumn }>
                 { STRINGS.registeredCompanyAddress }
            </div>
            <div className={ rightColumn }>
                { props.company.registeredCompanyAddress }
            </div>
        </div>

        <div className={ row }>
            <div className={ leftColumn }>
                 { STRINGS.addressForService }
            </div>
            <div className={ rightColumn }>
                { props.company.addressForService }
            </div>
        </div>

        { /* <div className={ titleRow }>
            <div className={ leftColumn }>
                 Optional Addresses
            </div>
        </div>

        <div className={ row }>
            <div className={ leftColumn }>
                 { STRINGS.addressForShareRegister}
            </div>
            <div className={ rightColumn }>
                { props.company.addressForShareRegister }
            </div>
        </div> */ }
        <hr/>
        <div className={ titleRow }>
            <div className={ leftColumn }>
                 Directors
            </div>
        </div>

        { props.company.directorList.directors.map((director, i) => {
            return <div key={i}>
                <div className={ condensedRow }>
                    <div className={ leftColumn }>
                         Full Legal Name
                    </div>
                    <div className={ rightColumn }>
                        { director.person.name }
                    </div>
                </div>
                <div className={ condensedRow }>
                    <div className={ leftColumn }>
                         Residential Address
                    </div>
                    <div className={ rightColumn }>
                        { director.person.address }
                    </div>
                </div>
                <div className={ condensedRow }>
                    <div className={ leftColumn }>
                         Appointment Date
                    </div>
                    <div className={ rightColumn }>
                        { stringDateToFormattedString(director.appointment) }
                    </div>
                </div>
                        <hr/>
            </div>
        })}

        <div className={ titleRow }>
            <div className={ leftColumn }>
                 Shareholdings
            </div>
        </div>

        <div className={ row }>
            <div className={ leftColumn }>
                 Total Number of Shares
            </div>
            <div className={ rightColumn }>
               { numberWithCommas(props.company.holdingList.holdings.reduce((sum, h) => {
                    return sum + h.parcels[0].amount
               }, 0))}
            </div>


        </div>

        <hr/>

        { props.company.holdingList.holdings.map((holding, i) => {
            return <div key={i}>
                <div className={ row }>
                    <div className={ leftColumn }>
                         { numberWithCommas(holding.parcels[0].amount) } Shares
                    </div>
                    <div className={ rightColumn }>
                        { holding.holders.map((holder, j) => {
                            return <div key={j}>
                            <div className="name">{ holder.person.name }</div>
                            <div>{ holder.person.address }</div>
                            </div>
                        })}
                    </div>
                </div>
                <hr/>
            </div>
        })}

    </div>
}

@AnnualReturnFromRouteHOC(true)
export class AnnualReturnLoader extends React.Component {
    render() {
        if(this.props.arSummary && this.props.arSummary.data) {
            return <div className="container annual-return-document">
                <ARSummary company={this.props.arSummary.data} />
                </div>
        }
        return null;
    }
}


@AnnualReturnHOC()
export class ReviewAnnualReturn extends React.PureComponent {

    renderControls() {
        return  <div className="button-row">
                <Link className="btn btn-primary" to={`/api/company/render/${this.props.companyId}/annual_return`} target='_blank'>Download</Link>
            </div>

    }

    render() {
        return <LawBrowserContainer lawLinks={ARLinks()}>
            <div className="widget">
                <div className="widget-header">
                    <div className="widget-title">
                        Review Annual Return
                    </div>
                </div>
                <div className="widget-body">
                    { this.renderControls() }
                    { this.props.arSummary && this.props.arSummary.data && <ARSummary company={this.props.arSummary.data} /> }
                </div>
            </div>
        </LawBrowserContainer>
    }
}


export default class AnnualReturn extends React.PureComponent {
    render() {
        return <LawBrowserContainer lawLinks={ARLinks()}>
            <div className="widget">
                <div className="widget-header">
                    <div className="widget-title">
                        Annual Returns
                    </div>
                </div>
                <div className="widget-body">
                    <p>If you have connected your RealMe with the Companies Office, and the Companies Office records are up to date, you can submit an Annual Return.</p>
                    <p>Click the button below to generate an Annual Return for review and submission.</p>
                    <div className="button-row"><Link to={`/company/view/${this.props.companyId}/review_annual_return`} className="btn btn-primary">Show Annual Return</Link></div>
                </div>
            </div>
        </LawBrowserContainer>
    }
}