"use strict";
import React, {PropTypes} from 'react';
import TransactionView from './forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { importCompany, addNotification, requestResource, createResource, importBulk, deleteResource, requestUserInfo } from '../actions';
import { reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { fieldStyle, fieldHelp, requireFields, formFieldProps } from '../utils';
import { push } from 'react-router-redux'
import LookupCompany from './lookupCompany';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { ConnectedPlaceholderSearch } from './search';
import { Link } from 'react-router';

export const REALME_LOGO = 'https://www.companiesoffice.govt.nz/companies/rm_logo.png';



export const realMeActions = (dispatch) => ({
    disconnectNzbn: () => {
        dispatch(deleteResource('/auth-with/nzbn', {
                confirmation: {
                    title: 'Confirm Disconnection of RealMe®',
                    description: 'Please confirm the disconnecting of RealMe® from your Good Companies account.',
                    resolveMessage: 'Confirm Disconnection',
                    resolveBsStyle: 'warning'
                }
            }))
            .then(result => dispatch(requestUserInfo({ refresh: true })))
            .then(result => dispatch(addNotification({ message: 'Your RealMe® account has been disconnected from your Good Companies account' })))
    }
});

@connect(state => ({userInfo: state.userInfo}), realMeActions)
export class RealMeConnect extends React.PureComponent {

    renderConnect() {
        return  (
            <div>
                <p>Retrieve a list of companies you have authority over using your RealMe® account.</p>
                <div className="button-row">
                    <a href="/api/auth-with/nzbn"><img alt="Lookup Companies with RealMe" src={REALME_LOGO}/></a>
                </div>
            </div>
        );
    }

    renderLink() {
        return (
            <div>
                <p>Your RealMe® account is connected with this Good Companies account.</p>

                <div className="button-row">
                    <Link to={'/import/nzbn'} className="btn btn-primary">Click here to select your Companies</Link>
                    <Button bsStyle="warning" type="submit" onClick={this.props.disconnectNzbn}>Disconnect from RealMe®</Button>
                </div>
            </div>
        );
    }

    render() {
        const hasNZBN = this.props.userInfo.mbieServices.indexOf('nzbn') >= 0;
        return <div className="container">
            <div className="widget">
                <div className="widget-header">
                    <div className="widget-title">
                       Import with RealMe®
                    </div>
                </div>
                <div className="widget-body">
                     <div className="row">
                     <div className="col-md-6 col-md-offset-3">
                     { hasNZBN && this.renderLink() }
                     { !hasNZBN && this.renderConnect() }
                     </div>
                    </div>
                </div>
            </div>
        </div>
    }
}

@connect(state => ({userInfo: state.userInfo}), (dispatch) => ({
    disconnectCompaniesOffice: () => {
        dispatch(deleteResource('/auth-with/companies-office', {
                confirmation: {
                    title: 'Confirm Disconnection of Companies Office account',
                    description: 'Please confirm the disconnecting of Companies Office account from your Good Companies account.',
                    resolveMessage: 'Confirm Disconnection',
                    resolveBsStyle: 'warning'
                }
            }))
            .then(result => dispatch(requestUserInfo({ refresh: true })))
            .then(result => dispatch(addNotification({ message: 'Your Companies Office account has been disconnected from your Good Companies account' })))
    }
}))
export class CompaniesOfficeIntegrationWidget extends React.PureComponent {
    render() {
        const hasCompaniesOfficeIntegration = this.props.userInfo.mbieServices.indexOf('companies-office') >= 0;

        return (
            <div className="widget">
                <div className="widget-header">
                    <div className="widget-title">Companies Office Integration</div>
                </div>
                <div className="widget-body">
                <div className="button-row">
                    { !hasCompaniesOfficeIntegration && <ConnectCompaniesOffice /> }
                    { hasCompaniesOfficeIntegration && <DisconnectCompaniesOffice disconnect={this.props.disconnectCompaniesOffice}/>}
                    </div>
                </div>
            </div>
        );
    }
}

const ConnectCompaniesOffice = () => {
    return <a className="btn btn-info" href="/api/auth-with/companies-office">Connect with Companies Office</a>;
}

const DisconnectCompaniesOffice = ({ disconnect }) => {
    return <Button bsStyle="warning" type="submit" onClick={disconnect}>Disconnect from Companies Office</Button>;
}




export default class CompaniesOfficeIntegration extends React.Component {
    render() {
        return (
            <div className="container">
                <CompaniesOfficeIntegrationWidget />
            </div>
        );
    }
}
