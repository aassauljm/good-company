"use strict";
import React, { PropTypes } from 'react';
import { Link } from 'react-router'
import STRINGS from '../strings'
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { pureRender } from '../utils';
import { updateResource, addNotification, showLoading, endLoading, requestResource } from '../actions';
import { ContactFormConnected, contactDetailsFormatSubmit, immutableFields, defaultCustomFields } from './forms/contactDetails';
import { replace, push } from 'react-router-redux'
import LawBrowserContainer from './lawBrowserContainer'
import LawBrowserLink from './lawBrowserLink'
import TransactionView from './forms/transactionView';
import Loading from './loading';
import Input from './forms/input';
import { ForeignPermissionsHOC } from '../hoc/resources';
import firstBy from 'thenby';



const permissionsToString = (permissions) => {
    if(permissions.indexOf('update') >= 0){
        return 'Update Access';
    }
     if(permissions.indexOf('read') >= 0){
        return 'View Only Access';
     }
     return 'No Access';
}

const RenderPermissionType = (props) => {
    return <strong> { permissionsToString(props.perm.permissions || []) } </strong>
}

@connect(state => ({
    userInfo: state.userInfo
}))
export class OrganisationWidget extends React.Component {
    static propTypes = {

    };


    renderBody() {
        const MAX_ROWS = 2;
        let bodyClass = "widget-body";
        const fullList = (this.props.userInfo.organisation || []);
        const members = fullList.slice(0, MAX_ROWS);
        members.sort(firstBy('name'))
        return  <div className="widget-body"  className={bodyClass} >
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
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    <span className="fa fa-yuers"/> Organisation
                </div>
                <div className="widget-control">
                 <Link to={`/organisation`} >View All</Link>
                </div>
            </div>
            { this.renderBody() }
        </div>
    }
}


@ForeignPermissionsHOC()
export class AccessListWidget extends React.Component {
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
    }

    renderBody() {
        let bodyClass = "widget-body expandable ";
        if(this.props.expanded){
            bodyClass += "expanded ";
        }

        const data = this.props.companyState;
        return  <div className="widget-body"  className={bodyClass} onClick={() => this.props.toggle(!this.props.expanded)}>
            <div key="body" >
            <dl className="dl-horizontal">
            <dt>{ STRINGS.accessControl.owner }</dt>
            <dd>{ this.props.owner && this.props.owner.username }</dd>

            <dt>{ STRINGS.accessControl.organisation }</dt>
            <dd>{ this.renderAccessList() }</dd>

            </dl>
            </div>
        </div>
    }

    render() {
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    <span className="fa fa-key"/> Access List
                </div>
                <div className="widget-control">
                 <Link to={`/company/view/${this.key()}/access_list`} >View All</Link>
                </div>
            </div>
            { this.renderBody() }
        </div>
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
    let addOrRemove ='add_permissions';
    let allow = value;

    if(permission === 'read'){
        if(!value){
            allow = false;
        }
        else{
            addOrRemove ='remove_permissions';
        }
    }

    if(permission === 'update'){
        if(!value){
            addOrRemove ='remove_permissions';
        }
    }

    if(addOrRemove === 'remove_permissions'){
        allow = !allow;
    }
    return {addOrRemove, permissions: [permission], allow}
}


@ForeignPermissionsHOC()
@connect(state => ({
    userInfo: state.userInfo
}), {
    updatePermission: (...args) => updateResource(...args),
    addNotification: (...args) => addNotification(...args),
    showLoading: (...args) => showLoading(...args),
    hideLoading: (...args) => endLoading(...args)
})
export default class AccessList extends React.Component {

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

     renderBody() {
        const foreignPermissions = (this.props.foreignPermissions && this.props.foreignPermissions.data) || [];
        const members = (this.props.userInfo.organisation && this.props.userInfo.organisation)  || [];
        members.sort(firstBy(a => a.name.toLowerCase()));
        return <div className="widget-body">
            <table className="table table-striped permissions">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>View Access</th>
                        <th>Make Changes</th>
                    </tr>
                </thead>
                <tbody>
                    { members.map((member, i) => {
                        const disabled = member.catalexId === this.props.userInfo.catalexId || member.userId === (this.props.owner || {}).id;
                        return <tr key={i}>
                            <td> { member.name } </td>
                            <td> <Input type="checkbox" checked={getPermissionValue('read', member, foreignPermissions )} disabled={disabled} onChange={(e) => this.onChange(e, member, 'read') }/></td>
                            <td> <Input type="checkbox" checked={getPermissionValue('update', member, foreignPermissions )} disabled={disabled} onChange={(e) => this.onChange(e, member, 'update')}/></td>
                        </tr>
                    })}
                </tbody>
            </table>
        </div>
     }

    render() {
        return (
            <div className="container">
                <div className="row">
                    <div className="col-xs-12">
                        <div className="widget">
                            <div className="widget-header">
                                <div className="widget-title">
                                    <span className="fa fa-key"/> Access List
                                </div>
                            </div>
                              { this.renderBody() }
                        </div>
                    </div>
                </div>
            </div>)
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
export class PermissionTable extends React.Component {
    componentDidUpdate(){
        this.props.fetchPermissions();
    }
    componentWillMount(){
        this.props.fetchPermissions();
    }
    onChange(event, company, permission) {
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

    render(){
        const companies = this.props.permissions.data || [];
        /*if(this.props.permissions._status === 'fetching'){
            return <Loading />
        }*/
        return <table className="table table-striped permissions">
        <thead><tr>

            <th>Name</th>
            <th>View Access</th>
            <th>Make Changes</th>
            </tr>

            </thead>
            <tbody>
                    { companies.map((member, i) => {
                        const disabled = member.userPermissions && member.ownerId === member.userPermissions.userId;
                        const permissions = (member.userPermissions || {}).permissions || [];
                        return <tr key={i}>
                             <td> { member.currentCompanyState.companyName } </td>
                            <td> <Input type="checkbox" checked={permissions.indexOf('read') >= 0 } disabled={disabled} onChange={(e) => this.onChange(e, member, 'read') }/></td>
                            <td> <Input type="checkbox" checked={permissions.indexOf('update') >= 0 } disabled={disabled} onChange={(e) => this.onChange(e, member, 'update')}/></td>
                        </tr>
                    })}
                </tbody>
        </table>
   }
}

@reduxForm({
    form: 'permissions',
    fields: ['user']
})
@connect(state => ({
    userInfo: state.userInfo
}))
export class Organisation extends React.Component {

    userSelect() {
        const members = (this.props.userInfo.organisation || []);
        members.sort(firstBy('name'))
        return <Input type="select" {...this.props.fields.user}>
            <option> </option>
            { members.filter(m => m.userId !== this.props.userInfo.id).map((m, i) => <option key={i} value={m.catalexId}>{m.name}</option>)}
        </Input>
    }

     renderBody() {
        return <div className="widget-body">
        <p>You can control access to companies by users within your organisation by selecting them in the control below</p>
        <div className="row">
            <div className="col-md-6 col-md-offset-3">
            { this.userSelect() }
        </div>


        </div>
        { this.props.fields.user.value && <PermissionTable catalexId={this.props.fields.user.value} userInfo={this.props.userInfo}/> }

        </div>
     }

    render() {
        return (
            <div className="container">
                <div className="row">
                    <div className="col-xs-12">
                        <div className="widget">
                            <div className="widget-header">
                                <div className="widget-title">
                                    <span className="fa fa-users"/> Organisation
                                </div>
                            </div>
                              { this.renderBody() }
                        </div>
                    </div>
                </div>
            </div>)
    }
}
