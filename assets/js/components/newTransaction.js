"use strict";
import React, {PropTypes} from 'react';
import { showModal } from '../actions';
import { pureRender, numberWithCommas } from '../utils';
import { connect } from 'react-redux';
import STRINGS from '../strings';
import LawBrowserLink from './lawBrowserLink'

//change company detail

//transfer shares

//issue shares

//repurchase shares

//update shareholding

@connect(state => state)
export class NewTransaction extends React.Component {
    static propTypes = {
        companyState: PropTypes.object,
        companyId: PropTypes.string,
    };

    render() {
        return <div className="new-transaction">
                    <div className="container">
                        <div className="well">
                            <h3>New Transaction</h3>
                        </div>
                    </div>
                    <div className="container">
                        <ul>
                            { /*<li className="actionable" onClick={() => this.props.dispatch(showModal('shareClasses', {companyState: this.props.companyState, companyId: this.props.companyId}))}>
                                <span className="glyphicon glyphicon-list-alt"></span>
                                <span className="transaction-button-text">Manage Share Classes</span>
                            </li> */ }

                            <li className="actionable" onClick={() => this.props.dispatch(showModal('issue', {companyState: this.props.companyState, companyId: this.props.companyId}))}>
                                <span className="glyphicon glyphicon-export"></span>
                                <span className="transaction-button-text">Issue Shares</span>
                            </li>

                            <li className="actionable">
                                <span className="glyphicon glyphicon-resize-full"></span>
                                <span className="transaction-button-text">Conversion/Subdivision of Shares</span>
                            </li>


                            <li className="actionable">
                                <span className="glyphicon glyphicon-shopping-cart"></span>
                                <span className="transaction-button-text">Acquisition of Shares</span>
                            </li>


                            <li className="actionable">
                                <span className="glyphicon glyphicon-usd"></span>
                                <span className="transaction-button-text">Purchase of Shares</span>
                            </li>

                            <li className="actionable">
                                <span className="glyphicon glyphicon-import"></span>
                                <span className="transaction-button-text">Redemption of Shares</span>
                            </li>


                            <li className="actionable">
                                <span className="glyphicon glyphicon-envelope"></span>
                                <span className="transaction-button-text">Consolidation of Shares</span>
                            </li>

                            <li className="actionable">
                                <span className="glyphicon glyphicon-transfer"></span>
                                <span className="transaction-button-text">Transfer Shares</span>
                            </li>

                            <li className="actionable">
                                <span className="glyphicon glyphicon-user"></span>
                                <span className="transaction-button-text">Update Shareholding</span>
                            </li>

                        </ul>
                    </div>
                </div>
    }
}
