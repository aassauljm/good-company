"use strict";
import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { endConfirmation, hideVersionWarning, hideBillingIssue } from '../actions';
import { LoadingOverlay } from './loading';
import EmailDocument from './modals/emailDocument';
import PreviewDocument from './modals/previewDocument';
import AnnualReturnInvite from './modals/annualReturnInvite';
import ARFeedback from './modals/arFeedback';



export class Confirmation extends React.Component {
    constructor(){
        super();
        this.resolve = ::this.resolve;
        this.reject = ::this.reject;
    }

    resolve() {
        this.props.dispatch(this.props.resolveAction);
        this.props.dispatch(endConfirmation());
    }

    reject() {
        this.props.dispatch(this.props.cancelAction);
        this.props.dispatch(endConfirmation());
    }
    render() {
        const {title, description, cancelMessage, resolveMessage} = this.props;
        return <Modal show={true} onHide={this.reject} ref="modal">
            <Modal.Header closeButton>
            <Modal.Title>{ title || 'Confirm' }</Modal.Title>
          </Modal.Header>
         <Modal.Body>
            { description || 'Please confirm the action' }
         </Modal.Body>
          <Modal.Footer>
            <Button bsStyle={this.props.cancelBsStyle} onClick={this.reject}>{ cancelMessage || 'Cancel' }</Button>
            <Button bsStyle={this.props.resolveBsStyle} onClick={this.resolve}>{ resolveMessage || 'Confirm' }</Button>
          </Modal.Footer>
        </Modal>
        return false;
    }
}

function NewGCVersionModal(props) {
    return (
        <Modal show={true} onHide={props.hide}>
            <Modal.Header closeButton>
                <Modal.Title>New Version of Good Companies</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                A new version of Good Companies has been released. Please click refresh to get the latest version.
            </Modal.Body>

            <Modal.Footer>
                <Button onClick={props.hide}>Ignore</Button>
                <Button bsStyle='primary' onClick={() => location.reload()}>Refresh</Button>
            </Modal.Footer>
        </Modal>
    );
}

const ConfirmationConnected = connect()(Confirmation);


export function Loading(props) {
    return <LoadingOverlay message={props.message} animationTime={props.animationTime}/>
}


function BillingIssueModal(props) {
    const isOrgAdmin = props.userInfo.organisation && props.userInfo.organisation.find(o => o.userId === props.userInfo.id).roles.indexOf('organisation_admin') >= 0;
    const isOwnedByOrgMember = props.userInfo.organisation &&  props.userInfo.organisation.find(o => o.userId === props.owner.id);
    const isBillPayer = !props.userInfo.organisation || isOrgAdmin;
    const showSelf = (props.selfOwned && isBillPayer) || (isOwnedByOrgMember && isOrgAdmin);

    const contactEmails = isOwnedByOrgMember ?
        props.userInfo.organisation.filter(o => o.roles.indexOf('organisation_admin') >= 0).map(o => ({name: o.name, email: o.email})) :
        [{name: props.owner.name, email: props.owner.email}];

    return (
        <Modal show={true} onHide={props.hide}>
            <Modal.Header closeButton>
                <Modal.Title>Suspended Company</Modal.Title>
            </Modal.Header>

            <Modal.Body>
            <p>Access to <strong>{ props.companyName }</strong> has been suspending pending an update of billing information.</p>

                { showSelf && <div className="button-row"><a className="btn btn-primary" href={props.upgradeUrl}>Click here to update billing</a></div> }
                { !showSelf && isOwnedByOrgMember && <div>
                    <p>Please contact your Organisation Administrator(s):</p>
                    { contactEmails.map((c, i) => <div key={i}>{ c.name }: <a className="vanity-link" href={`mailto::${c.email}`}>{ c.email }</a></div>) }
                    </div> }
                { !showSelf && !isOwnedByOrgMember && <div>
                    <p>Please contact the Administrator for this company:</p>
                    { contactEmails.map((c, i) => <div key={i}>{ c.name }: <a className="vanity-link" href={`mailto::${c.email}`}>{ c.email }</a></div>) }
                    </div> }
            </Modal.Body>

            <Modal.Footer>

            </Modal.Footer>
        </Modal>
    );
}


@connect(state => ({modals: state.modals}), {
    hideVersionWarning: () => hideVersionWarning(),
    hideBillingIssue: () => hideBillingIssue()
})
export default class Modals extends React.Component {
    render() {
        if(this.props.modals.confirmation && this.props.modals.confirmation.showing){
            return <ConfirmationConnected {...this.props.modals.confirmation} />
        }
        else if(this.props.modals.loading && this.props.modals.loading.showing){
            return  <Loading {...this.props.modals.loading} />
        }
        else if (this.props.modals.emailDocument && this.props.modals.emailDocument.showing) {
            return <EmailDocument {...this.props.modals.emailDocument} />
        }
        else if (this.props.modals.arInvite && this.props.modals.arInvite.showing) {
            return <AnnualReturnInvite {...this.props.modals.arInvite} />
        }
        else if (this.props.modals.versionWarning && this.props.modals.versionWarning.showing) {
            return <NewGCVersionModal hide={this.props.hideVersionWarning} />
        }
        else if (this.props.modals.billingIssue && this.props.modals.billingIssue.showing) {
            return <BillingIssueModal {...this.props.modals.billingIssue } hide={this.props.hideBillingIssue} />
        }
        else if (this.props.modals.previewDocument && this.props.modals.previewDocument.showing) {
            return <PreviewDocument {...this.props.modals.previewDocument } />
        }
        else if (this.props.modals.arFeedback && this.props.modals.arFeedback.showing) {
            return <ARFeedback {...this.props.modals.arFeedback } />
        }
        return false;
    }

}
