"use strict";
import React from 'react';
import PropTypes from 'prop-types';
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
import Widget from './widget';
import LawBrowserContainer from './lawBrowserContainer';


@connect(state => ({userInfo: state.userInfo}), (dispatch) => ({
    disconnectCompaniesOffice: () => {
        return dispatch(deleteResource('/auth-with/companies-office', {
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
            <Widget iconClass="fa fa-cogs" title="Companies Office">
                    { !hasCompaniesOfficeIntegration && <ConnectCompaniesOffice /> }
                    { hasCompaniesOfficeIntegration && !this.props.showDisconnect && <div>
                            <p>You have connected your RealMe account, allowing submission of company changes and annual returns.</p>
                            <div className="button-row">
                            <Link to='/companies_office_integration' className="btn btn-info">Manage My Integration</Link>
                                </div>
                        </div> }
                    { hasCompaniesOfficeIntegration && this.props.showDisconnect && <DisconnectCompaniesOffice disconnect={this.props.disconnectCompaniesOffice} /> }
            </Widget>
        );
    }
}

export const ConnectCompaniesOfficeLink = (props) => {
    let url = '/api/auth-with/companies-office';
    return <a className={props.className}  href={url} onClick={(e) => {e.preventDefault(); window.open(url); return false;}}>{ props.label } </a>
}


export const ConnectCompaniesOffice = (props) => {
    return  <div>
            <p>Connect your RealMe with the Companies to enable the submission of company changes and annual returns.</p>
            <div className="button-row">
                <ConnectCompaniesOfficeLink className="btn btn-info" label="Connect with Companies Office" />
                { props.children }
                </div>
        </div>
}

const DisconnectCompaniesOffice = ({ disconnect }) => {
    return  <div>
       <p>You have connected your RealMe account, allowing submission of company changes and annual returns.  You can disconnect your account by clicking the link below.</p>
        <div className="button-row">
        <Button bsStyle="warning" type="submit" onClick={disconnect}>Disconnect from Companies Office</Button>
        </div>
        </div>
}




export default class CompaniesOfficeIntegration extends React.Component {
    render() {
        return (
            <LawBrowserContainer>
                <CompaniesOfficeIntegrationWidget showDisconnect={true}/>
            </LawBrowserContainer>
        );
    }
}
