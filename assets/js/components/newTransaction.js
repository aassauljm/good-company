"use strict";
import React, {PropTypes} from 'react';
import { requestResource } from '../actions';
import { pureRender, numberWithCommas } from '../utils';
import { connect } from 'react-redux';
import STRINGS from '../strings';
import LawBrowserLink from './lawBrowserLink'

//change company detail

//transfer shares

//issue shares

//repurchase shares

//update shareholding


export class NewTransaction extends React.Component {
    static propTypes = {
        data: PropTypes.object.isRequired,
    };

    render() {
        return <div>
                    <div className="container">
                        <div className="well">
                            <h3>New Transaction</h3>
                        </div>
                    </div>


                </div>
    }
}
