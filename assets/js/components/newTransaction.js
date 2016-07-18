"use strict";
import React, {PropTypes} from 'react';
import { showModal } from '../actions';
import { pureRender, numberWithCommas } from '../utils';
import { connect } from 'react-redux';
import STRINGS from '../strings';
import LawBrowserLink from './lawBrowserLink'
import Modals from './modals';
import { withRouter } from 'react-router'
import { push } from 'react-router-redux'




const DEFAULT_OBJ = {};

@connect(state => ({modals: state.modals || DEFAULT_OBJ}),
{
    navigate: (url) => push(url),
    startTransaction: (key, companyState, companyId) => showModal(key, {companyState: companyState, companyId: companyId})
})
@withRouter
export class NewTransaction extends React.Component {
    static propTypes = {
        companyState: PropTypes.object,
        companyId: PropTypes.string,
    };


    componentWillMount() {
    // leaving for now
        return;
        this.props.router.setRouteLeaveHook(
            this.props.route,
            ::this.routerWillLeave
        )
    }

    routerWillLeave(location) {
        const transactionUp = this.props.modals.showing;
        const skip = (location.state || {}).skipDirtyLeave;
        if(transactionUp && !skip){
            return 'You have unsaved information in a new transaction, are you sure you want to leave?'
        }
    }

    startTransaction(key) {
        const id = this.props.companyId;
        this.props.navigate(`/company/view/${id}/new_transaction`);
        this.props.startTransaction(key, this.props.companyState, this.props.companyId)
    }

    renderBody() {
        const id = this.props.companyId;
        return <div className="container">
            <div className="row">
            <div className="widget">
                <div className="widget-header">
                    <div className="widget-title">
                        Update Company
                    </div>
                </div>
                <div className="widget-body">
                    <div className="row">
                    <div className="actionable select-button" onClick={() => this.startTransaction('addAssignShares') } >
                            <span className="glyphicon glyphicon-list-alt"></span>
                            <span className="transaction-button-text">Add & Assign Share Classes</span>
                    </div>
                    <div className="actionable select-button" onClick={() => this.startTransaction('consolidateDivide') } >
                            <span className="glyphicon glyphicon-duplicate"></span>
                            <span className="transaction-button-text">Consolidate or Subdivide Shares</span>
                    </div>
                    <div className="actionable select-button" onClick={() => this.startTransaction('issue') } >
                            <span className="glyphicon glyphicon-share"></span>
                            <span className="transaction-button-text">Issue New Shares</span>
                    </div>
                    <div className="actionable select-button" onClick={() => this.startTransaction('repurchaseRedeem') } >
                            <span className="glyphicon glyphicon-usd"></span>
                            <span className="transaction-button-text">Repurchase or Redeem Shares</span>
                    </div>
                    <div className="actionable select-button" onClick={() => this.startTransaction('transfer') } >
                            <span className="glyphicon glyphicon-transfer"></span>
                            <span className="transaction-button-text">Transfer Shares</span>
                    </div>
                    <div className="actionable select-button" onClick={() => this.props.navigate({pathname: `/company/view/${id}/contact`, state: {skipDirtyLeave: true}}) } >
                            <span className="glyphicon glyphicon-envelope"></span>
                            <span className="transaction-button-text">Update Contact</span>
                    </div>
                    <div className="actionable select-button" onClick={() => this.startTransaction('selectDirector')  } >
                            <span className="glyphicon glyphicon-user"></span>
                            <span className="transaction-button-text">Update Directors</span>
                    </div>
                    <div className="actionable select-button" onClick={() => this.startTransaction('updateHoldingHolder')  } >
                            <span className="glyphicon glyphicon-piggy-bank"></span>
                            <span className="transaction-button-text">Update Shareholders</span>
                    </div>

                    <div className="actionable select-button" onClick={() => this.startTransaction('resetDelete')  } >
                            <span className="glyphicon glyphicon-trash"></span>
                            <span className="transaction-button-text">Reset or Delete Company</span>
                    </div>

                    </div>

                </div>
            </div>
            </div>
        </div>
    }

    render() {
        return <div className="new-transaction icon-action-page">
               { this.props.modals.showing &&  <Modals {...this.props.modals} /> }
               { !this.props.modals.showing && this.renderBody() }
            </div>
    }
}





