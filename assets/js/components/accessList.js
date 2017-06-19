"use strict";
import React, { PropTypes } from 'react';
import { Link } from 'react-router'
import STRINGS from '../strings'
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { formFieldProps, requireFields } from '../utils';
import { updateResource, addNotification, showLoading, endLoading, requestResource, createResource } from '../actions';
import { ContactFormConnected, contactDetailsFormatSubmit, immutableFields, defaultCustomFields } from './forms/contactDetails';
import { replace, push } from 'react-router-redux'
import LawBrowserContainer from './lawBrowserContainer'
import LawBrowserLink from './lawBrowserLink'
import TransactionView from './forms/transactionView';
import Loading from './loading';
import Input from './forms/input';
import { ForeignPermissionsHOC } from '../hoc/resources';
import firstBy from 'thenby';
import Widget from './widget';


const permissionsToString = (permissions) => {
    if(permissions.indexOf('update') >= 0){
        return STRINGS.permissions.update;
    }
    if(permissions.indexOf('read') >= 0){
        return STRINGS.permissions.readOnly;
    }
    return 'No Access';
}

const RenderPermissionType = (props) => {
    return <strong> { permissionsToString(props.perm.permissions || []) } </strong>
}

@connect(state => ({
    userInfo: state.userInfo
}))
export class OrganisationWidget extends React.PureComponent {
    static propTypes = {

    };

    renderBody() {
        const MAX_ROWS = 5;
        const fullList = (this.props.userInfo.organisation || []);
        const members = fullList.slice(0, MAX_ROWS);
        members.sort(firstBy('name'))
        return  <div  >
            <div key="body" >
                <table className="table table-striped table-no-margin" >
                <tbody>
                { members.map((member, i) => {
                    return <tr key={i}><td>{ member.name }</td><td> { member.email }</td></tr>
                }) }
                </tbody>
                </table>
                { fullList.length > MAX_ROWS && <div className="button-row">...</div>}
            <div className="button-row">
                   <Link to={`/organisation`} className="btn btn-info">Edit Access</Link>
            </div>
            </div>
        </div>
    }

    render() {
        return <Widget className="organisation-widget" iconClass="fa fa-users" title="Organisation" link="/organisation">
            { this.renderBody() }
        </Widget>
    }
}


@ForeignPermissionsHOC()
@connect(state => ({
    userInfo: state.userInfo
}))
export class AccessListWidget extends React.PureComponent {
    static propTypes = {
        companyState: PropTypes.object.isRequired,
        companyId: PropTypes.string.isRequired,
        toggle: PropTypes.func.isRequired,
        expanded: PropTypes.bool
    };

    key() {
        return this.props.companyId;
    }

    renderAccessList() {
        if(this.props.foreignPermissions && this.props.foreignPermissions.data){
            return this.props.foreignPermissions.data.map((perm, i) => {
                return <div key={i}>{ perm.name } <RenderPermissionType perm={perm} /></div>
            })
        }
        else{
            return <div>None</div>
        }
    }

    renderBody() {

        const hasOrg = !!this.props.userInfo.organisation
        const data = this.props.companyState;
        return  <div onClick={() => this.props.toggle(!this.props.expanded)}>
            <div key="body" >
            <dl className="dl-horizontal">
            <dt>{ STRINGS.accessControl.owner }</dt>
            <dd>{ this.props.owner && this.props.owner.username }</dd>

            <dt>{ STRINGS.accessControl.accessList }</dt>
            <dd>{ this.renderAccessList() }</dd>

            </dl>
            </div>
        </div>
    }

    render() {
        let bodyClass = "expandable ";
        if(this.props.expanded){
            bodyClass += "expanded ";
        }
        return  <Widget iconClass="fa fa-key" title="Access List" link={`/company/view/${this.key()}/access_list`} bodyClass={bodyClass}>
            { this.renderBody() }
        </Widget>
    }
}


function getPermissionValue(permission, member, foreignPermissions){
    const perms = foreignPermissions.find(p => p.catalexId === member.catalexId);
    if(!perms){
        return false;
    }
    return perms.permissions.indexOf(permission) >= 0;
}

function formatChange(value, catalexId, permission){
    // currently assumming that by default, org members get read
    let addOrRemove = 'add_permissions';
    let allow = value;

    //if(permission === 'read'){
        if(!value){
            allow = false;
        }
        else{
            addOrRemove ='remove_permissions';
        }
    //}

    /*if(permission === 'update'){
        if(!value){
            addOrRemove ='remove_permissions';
        }
    }*/

    if(addOrRemove === 'remove_permissions'){
        allow = !allow;
    }
    return {addOrRemove, permissions: [permission], allow}
}

@reduxForm({
    form: 'thirdPartyAccess',
    fields: ['name', 'email'],
    validate: requireFields('name', 'email')
})
@formFieldProps()
class InviteThirdPartyForm extends React.PureComponent {
    render() {
        const { fields } = this.props;
        return <form className="form" onSubmit={this.props.handleSubmit}>
            <div className="row">
                <div className="col-md-3 col-md-offset-2">
                    <Input type="text" {...this.formFieldProps('name')} label='' placeholder="name"/>
                </div>
                <div className="col-md-3">
                    <Input type="email" {...this.formFieldProps('email')} label='' placeholder="email"/>
                </div>
                 <div className="col-md-2">
                    <Button type="submit" bsStyle="primary">Invite to View</Button>
                </div>
            </div>
        </form>
    }
}


@ForeignPermissionsHOC()
@connect(state => ({
    userInfo: state.userInfo,
    login: state.login
}), {
    updatePermission: (...args) => updateResource(...args),
    addNotification: (...args) => addNotification(...args),
    showLoading: (...args) => showLoading(...args),
    hideLoading: (...args) => endLoading(...args)
})
export default class AccessList extends React.PureComponent {

    constructor(props) {
        super(props);
        this.addThirdParty = ::this.addThirdParty;
    }

    onChange(event, member, permission) {
        const value = event.target.checked;
        const {addOrRemove, permissions, allow} = formatChange(value, member.catalexId, permission)
        this.props.showLoading({message: 'Updating'});
        this.props.updatePermission(`/company/${this.props.companyId}/${addOrRemove}`, {permissions, allow, catalexId: member.catalexId }, {
            invalidates: []//[`/company/${this.props.companyId}/foreign_permissions`]
        })
        .then((r) => {
            this.props.addNotification({message: r.response.message});
            return this.props.fetch(true);
        })
        .then(() =>{
            this.props.hideLoading();
        })
        .catch(error => {
            this.props.addNotification({message: 'Unable to update permissions', error: true})
            this.props.hideLoading();
        })
    }

    renderOrgAccess(foreignPermissions) {
        const members = (this.props.userInfo.organisation && this.props.userInfo.organisation)  || [];
        members.sort(firstBy(a => a.name.toLowerCase()));
        return <div>
            <h4 className="text-center">Organisation</h4>
            <table className="table table-striped permissions">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>{ STRINGS.permissions.read } </th>
                        <th>{ STRINGS.permissions.update }</th>
                    </tr>
                </thead>
                <tbody>
                    { members.map((member, i) => {
                        const disabled = member.catalexId === this.props.userInfo.catalexId || member.userId === (this.props.owner || {}).id;
                        return <tr key={i}>
                            <td> { member.name } </td>
                            <td> { member.email } </td>
                            <td> <Input type="checkbox" checked={getPermissionValue('read', member, foreignPermissions )} disabled={disabled} onChange={(e) => this.onChange(e, member, 'read') }/></td>
                            <td> <Input type="checkbox" checked={getPermissionValue('update', member, foreignPermissions )} disabled={disabled} onChange={(e) => this.onChange(e, member, 'update')}/></td>
                        </tr>
                    })}
                </tbody>
            </table>
            <div className="button-row">
                <a className="btn btn-info" href={`${this.props.login.userUrl}/organisation`}>Manage Organisation</a>
            </div>
            <hr/>
        </div>
    }

    addThirdParty(data) {
        this.props.showLoading({message: 'Updating'});
        this.props.updatePermission(`/company/${this.props.companyId}/invite_user_with_permission`, {permissions: ['read'], name: data.name, email: data.email }, {
            invalidates: []//[`/company/${this.props.companyId}/foreign_permissions`]
        })
        .then((r) => {
            this.props.addNotification({message: r.response.message});
            return this.props.fetch(true);
        })
        .then(() =>{
            this.props.hideLoading();
        })
        .catch(error => {
            this.props.addNotification({message: 'Unable to update permissions', error: true})
            this.props.hideLoading();
        })
    }

    removeThirdParty(catalexId) {
        this.props.showLoading({message: 'Updating'});
        this.props.updatePermission(`/company/${this.props.companyId}/remove_permissions`, {permissions: ['read'], allow: true, catalexId: catalexId }, {
            invalidates: []//[`/company/${this.props.companyId}/foreign_permissions`]
        })
        .then((r) => {
            this.props.addNotification({message: r.response.message});
            return this.props.fetch(true);
        })
        .then(() =>{
            this.props.hideLoading();
        })
        .catch(error => {
            this.props.addNotification({message: 'Unable to update permissions', error: true})
            this.props.hideLoading();
        })
    }

    renderThirdPartyAccess() {
        const thirdParties = (this.props.foreignPermissions.data || []) .filter(d => !d.organisation)
        return <div>
            <h4 className="text-center">External View Access</h4>
            <table className="table table-striped permissions">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Remove</th>
                    </tr>
                </thead>
                <tbody>
                    { thirdParties.map((member, i) => {
                        return <tr key={i}>
                            <td> { member.name } </td>
                            <td> { member.email } </td>
                            <td> <Button bsStyle={'danger'} bsSize="small" onClick={() => this.removeThirdParty(member.catalexId)}>Remove</Button></td>
                        </tr>
                    })}
                </tbody>
            </table>


            <InviteThirdPartyForm onSubmit={this.addThirdParty} />

        </div>
    }

    renderBody() {
        const foreignPermissions = (this.props.foreignPermissions && this.props.foreignPermissions.data) || [];
        return <div>
            { this.props.userInfo.organisation && this.renderOrgAccess(foreignPermissions) }
            { this.renderThirdPartyAccess(foreignPermissions) }
        </div>
    }

    render() {
        return <LawBrowserContainer>
            <Widget iconClass="fa fa-key" title="Access List">
                { this.renderBody() }
            </Widget>
        </LawBrowserContainer>
    }
}

@connect((state, ownProps) => ({
    permissions: state.resources[`/company/permissions/${ownProps.catalexId}`] || {}
}),
 (dispatch, ownProps) => ({
    fetchPermissions: (refresh) => dispatch(requestResource(`/company/permissions/${ownProps.catalexId}`, {refresh})),
    updatePermission: (...args) => dispatch(updateResource(...args)),
    addNotification: (...args) => dispatch(addNotification(...args)),
    showLoading: (...args) => dispatch(showLoading(...args)),
    hideLoading: (...args) => dispatch(endLoading(...args))
}))
export class PermissionTable extends React.PureComponent {

    constructor(props) {
        super(props);
        this.updateAll = ::this.updateAll;
    }

    componentDidUpdate(){
        this.props.fetchPermissions();
    }

    componentWillMount(){
        this.props.fetchPermissions();
    }

    massUpdate(companies, permission, shouldGivePermission) {


        const requestPayload = {
            catalexId: this.props.catalexId,
            allow: shouldGivePermission,
            companyIds,
            permissions: [permission]
        };
    }

    updateAllCompanies(permission, value) {
        const companies = (this.props.permissions.data || {}).companyPermissions || [];
        // Get the id of all the companies that need updated
        const companyIds = companies.reduce((companiesToUpdate, company) => {
            const permissions = (company.userPermissions || {}).permissions || [];
            const hasPermission = permissions.indexOf(permission) >= 0;
            const permissionNeedsUpdated = hasPermission !== value;
            if(permissionNeedsUpdated) {
                companiesToUpdate.push(company.id);
            }
            return companiesToUpdate;
        }, []);

        const actions = companyIds.map(companyId => {
            const {addOrRemove, permissions, allow} = formatChange(value, this.props.catalexId, permission)
            return {addOrRemove, permissions, allow, companyId}
        })
        this.props.updatePermission(`/company/permissions/${this.props.catalexId}`, {permissionChanges: actions}, {
            invalidates: []
        })
        .then((r) => {
            this.props.addNotification({message: r.response.message});
            return this.props.fetchPermissions(true)
        })
        .then(() =>{
            this.props.hideLoading();
        })
        .catch(error => {
            this.props.fetchPermissions(true)
            this.props.addNotification({message: 'Unable to update permissions', error: true})
            this.props.hideLoading();
        })

    }

    updateAll(event, perm) {
        this.updateAllCompanies(perm, event.target.checked);
    }

    onCompanyChange(event, company, permission) {
        const value = event.target.checked;
        const {addOrRemove, permissions, allow} = formatChange(value, this.props.catalexId, permission)
        this.props.showLoading({message: 'Updating'});
        this.props.updatePermission(`/company/${company.id}/${addOrRemove}`, {permissions, allow, catalexId: this.props.catalexId}, {
            invalidates: []
        })
        .then((r) => {
            this.props.addNotification({message: r.response.message});
            return this.props.fetchPermissions(true)
        })
        .then(() =>{
            this.props.hideLoading();
        })
        .catch(error => {
            this.props.addNotification({message: 'Unable to update permissions', error: true})
            this.props.hideLoading();
        })
    }

    onUserChange(event, permission) {
        const value = event.target.checked;
        const {addOrRemove, permissions, allow} = formatChange(value, this.props.catalexId, permission)
        this.props.showLoading({message: 'Updating'});
        this.props.updatePermission(`/user/${addOrRemove}`, {permissions, model: 'Company', allow, catalexId: this.props.catalexId}, {
            invalidates: []
        })
        .then((r) => {
            this.props.addNotification({message: r.response.message});
            return this.props.fetchPermissions(true)
        })
        .then(() =>{
            this.props.hideLoading();
        })
        .catch(error => {
            this.props.addNotification({message: 'Unable to update permissions', error: true})
            this.props.hideLoading();
        })
    }

    render(){
        const companies = (this.props.permissions.data || {}).companyPermissions || [];
        const userPermissions =(this.props.permissions.data || {}).userPermissions || [];
        const userPermissionsLoading = this.props.permissions._status === 'fetching' && !this.props.permissions.data;

        const allRead = companies.every(company => ((company.userPermissions || {}).permissions || []).indexOf('read') >= 0);
        const allUpdate = companies.every(company => ((company.userPermissions || {}).permissions || []).indexOf('update') >= 0);

        return <div>
            <div className="button-row">
                <Input type="checkbox" checked={ userPermissions.indexOf('create') >= 0 } disabled={false} onChange={(e) => this.onUserChange(e, 'create')} label="Can Import New Companies" />
            </div>
        <table className="table table-striped permissions">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>View Access</th>
                    <th>Make Changes</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>All</strong></td>
                    <td><Input type="checkbox" checked={allRead} disabled={false} onChange={(e) => this.updateAll(e, 'read')}/></td>
                    <td><Input type="checkbox" checked={allUpdate} disabled={false} onChange={(e) => this.updateAll(e, 'update')}/></td>
                </tr>
            { userPermissionsLoading && <tr><td colSpan="3"><Loading /></td></tr>}
                { companies.map((company, i) => {
                    const disabled = company.userPermissions && company.ownerId === company.userPermissions.userId;
                    const permissions = (company.userPermissions || {}).permissions || [];
                    return <tr key={i}>
                         <td> { company.currentCompanyState.companyName } </td>
                        <td> <Input type="checkbox" checked={permissions.indexOf('read') >= 0 } disabled={disabled} onChange={(e) => this.onCompanyChange(e, company, 'read') }/></td>
                        <td> <Input type="checkbox" checked={permissions.indexOf('update') >= 0 } disabled={disabled} onChange={(e) => this.onCompanyChange(e, company, 'update')}/></td>
                    </tr>
                })}
                </tbody>
        </table>
        </div>
   }
}

@reduxForm({
    form: 'permissions',
    fields: ['user']
})
@connect(state => ({
    userInfo: state.userInfo,
    login: state.login
}))
export class Organisation extends React.PureComponent {

    userSelect() {
        const members = (this.props.userInfo.organisation || []);
        members.sort(firstBy('name'))
        return <Input type="select" {...this.props.fields.user}>
            <option> </option>
            { members.filter(m => m.userId !== this.props.userInfo.id).map((m, i) => <option key={i} value={m.catalexId}>{m.name}</option>) }
        </Input>
    }

     renderBody() {
        return <div>
            <div className="button-row">
                <a className="btn btn-info" href={`${this.props.login.userUrl}/organisation`}>Invite Users to your Organisation</a>
            </div>
                <div className="row">
                    <div className="col-md-6 col-md-offset-3">
                    <p>As an organisation administrator, you can control how users within your organisation access Good Companies.  Click the box below to select a user and determine their permissions.</p>
                    { this.userSelect() }
                </div>
            </div>

        { this.props.fields.user.value && <PermissionTable catalexId={this.props.fields.user.value} userInfo={this.props.userInfo} /> }
        </div>
     }

    render() {
        return <LawBrowserContainer>
            <Widget iconClass="fa fa-users" title="Organisation">
                { this.renderBody() }
            </Widget>
        </LawBrowserContainer>
    }
}
