"use strict";
import React, {PropTypes} from 'react';
import { showTransactionView } from '../actions';
import { pureRender, numberWithCommas } from '../utils';
import { connect } from 'react-redux';
import STRINGS from '../strings';
import LawBrowserLink from './lawBrowserLink'
import TransactionViews from './transactionViews';
import { withRouter } from 'react-router'
import { push } from 'react-router-redux'
import Widget from './widget';
import LawBrowserContainer from './lawBrowserContainer';






const DEFAULT_OBJ = {};

@connect(state => ({transactionViews: state.transactionViews || DEFAULT_OBJ}),
{
    navigate: (url) => push(url),
    startTransaction: (key, companyState, companyId) => showTransactionView(key, {companyState: companyState, companyId: companyId})
})
@withRouter
export class NewTransaction extends React.Component {
    static propTypes = {
        companyState: PropTypes.object,
        companyId: PropTypes.string,
    };

    constructor() {
        super();
        this.startTransaction = ::this.startTransaction;
    }

    componentWillMount() {
        return;
    // leaving for now
        this.props.router.setRouteLeaveHook(
            this.props.route,
            ::this.routerWillLeave
        )
    }

    routerWillLeave(location) {
        const transactionUp = this.props.transactionViews.showing;
        const skip = (location.state || {}).skipDirtyLeave;
        if(transactionUp && !skip){
            return 'You have unsaved information in a new transaction, are you sure you want to leave?'
        }
    }

    startTransaction(key) {
        const id = this.props.companyId;
        //this.props.navigate(`/company/view/${id}/new_transaction`);
        this.props.startTransaction(key, this.props.companyState, this.props.companyId)
    }

    renderBody() {
        const id = this.props.companyId;
        return <LawBrowserContainer>
            <Widget title="Update Company">
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
                    <div className="actionable select-button transfer" onClick={() => this.startTransaction('transfer') } >
                            <span className="glyphicon glyphicon-transfer"></span>
                            <span className="transaction-button-text">Transfer Shares</span>
                    </div>
                    <div className="actionable select-button" onClick={() => this.startTransaction('contactDetails') } >
                            <span className="glyphicon glyphicon-envelope"></span>
                            <span className="transaction-button-text">Update Contact</span>
                    </div>

                    <div className="actionable select-button" onClick={() => this.startTransaction('updateAddresses') } >
                            <span className="glyphicon glyphicon-home"></span>
                            <span className="transaction-button-text">Update Addresses</span>
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

                    </Widget>
            </LawBrowserContainer>
        }


    render() {
        if(this.props.children){
            const { children, ...props } = this.props;
            return <div className="new-transaction icon-action-page">
                 { !this.props.transactionViews.showing && React.cloneElement(this.props.children, {...props, ...this.props.transactionViews, show: this.startTransaction} ) }
                 { this.props.transactionViews.showing &&  <TransactionViews {...this.props} {...this.props.transactionViews}  /> }
                </div>
        }
        return <div className="new-transaction icon-action-page">
               { this.props.transactionViews.showing &&  <TransactionViews {...this.props} {...this.props.transactionViews} /> }
               { !this.props.transactionViews.showing && this.renderBody() }
            </div>
    }
}





