"use strict";
import React, {PropTypes} from 'react';
import { showModal } from '../actions';
import { pureRender, numberWithCommas } from '../utils';
import { connect } from 'react-redux';
import STRINGS from '../strings';
import LawBrowserLink from './lawBrowserLink'



@connect(undefined, {
    showModal: (key, data) => showModal(key, data),
})
export class NewTransaction extends React.Component {
    static propTypes = {
        companyState: PropTypes.object,
        companyId: PropTypes.string,
    };

    show(key) {
        this.props.showModal(key, {companyState: this.props.companyState, companyId: this.props.companyId, afterClose: {location: this.props.location.pathname}});
    }

    render() {
        return <div className="new-transaction">
                    { /* <div className="container">
                        <div className="well">
                            <h3>New Transaction</h3>
                        </div>
                    </div> */ }
                    <div className="container">
                        <ul>
                            <li className="actionable apply-share-classes" onClick={() => this.show('applyShareClasses')}>
                                <span className="glyphicon glyphicon-list-alt"></span>
                                <span className="transaction-button-text">Apply Share Classes</span>
                            </li>

                            <li className="actionable" onClick={() => this.show('issue')} >
                                <span className="glyphicon glyphicon-export"></span>
                                <span className="transaction-button-text">Issue Shares</span>
                            </li>

                            <li className="actionable" onClick={() => this.show('subdivision')} >
                                <span className="glyphicon glyphicon-resize-full"></span>
                                <span className="transaction-button-text">Subdivision of Shares</span>
                            </li>


                            <li className="actionable"  onClick={() => this.show('acquisition')} >
                                <span className="glyphicon glyphicon-shopping-cart"></span>
                                <span className="transaction-button-text">Acquisition of Shares</span>
                            </li>


                            <li className="actionable"  onClick={() => this.show('purchase')} >
                                <span className="glyphicon glyphicon-usd"></span>
                                <span className="transaction-button-text">Purchase of Shares</span>
                            </li>

                            <li className="actionable"  onClick={() => this.show('redemption')} >
                                <span className="glyphicon glyphicon-import"></span>
                                <span className="transaction-button-text">Redemption of Shares</span>
                            </li>


                            <li className="actionable"  onClick={() => this.show('consolidation')} >
                                <span className="glyphicon glyphicon-envelope"></span>
                                <span className="transaction-button-text">Consolidation of Shares</span>
                            </li>

                            <li className="actionable"  onClick={() => this.show('transfer')} >
                                <span className="glyphicon glyphicon-transfer"></span>
                                <span className="transaction-button-text">Transfer Shares</span>
                            </li>

                            <li className="actionable"  onClick={() => this.show('selectHolding')} >
                                <span className="glyphicon glyphicon-briefcase"></span>
                                <span className="transaction-button-text">Update Shareholding</span>
                            </li>

                            <li className="actionable"  onClick={() => this.show('selectPerson')} >
                                <span className="glyphicon glyphicon-user"></span>
                                <span className="transaction-button-text">Update Shareholder</span>
                            </li>

                            <li className="actionable"  onClick={() => this.show('updateCompany')} >
                                <span className="glyphicon glyphicon-info-sign"></span>
                                <span className="transaction-button-text">Update Company Information</span>
                            </li>

                            <li className="actionable" onClick={() => this.show('selectDirector')} >
                                <span className="glyphicon glyphicon-blackboard"></span>
                                <span className="transaction-button-text">Manage Directors</span>
                            </li>

                        </ul>
                    </div>
                </div>
    }
}




@pureRender
export class NewTransactionPanel extends React.Component {

    render(){
        return <div className="panel panel-info" >
            <div className="panel-heading">
            <h3 className="panel-title">Update Company</h3>
            </div>
            <div className="panel-body">
                Change details, issue or purchase shares, transfer shares...
            </div>
        </div>
    }
}

