"use strict";
import React, {PropTypes} from 'react';
import { showModal } from '../actions';
import { pureRender, numberWithCommas } from '../utils';
import { connect } from 'react-redux';
import STRINGS from '../strings';
import LawBrowserLink from './lawBrowserLink'
import Modals from './modals';
import { withRouter } from 'react-router'

const DEFAULT_OBJ = {};

@connect(state => ({modals: state.modals || DEFAULT_OBJ}))
@withRouter
export class NewTransaction extends React.Component {
    static propTypes = {
        companyState: PropTypes.object,
        companyId: PropTypes.string,
    };


    componentWillMount() {
      this.props.router.setRouteLeaveHook(
        this.props.route,
        ::this.routerWillLeave
      )
    }

    routerWillLeave() {
        if(this.props.modals.showing){
            return 'You have unsaved information in a new transaction, are you sure you want to leave?'
        }
    }


    renderBody() {
        return <div className="container">
            <div className="row">
            <div className="widget">
                <div className="widget-header">
                    <div className="widget-title">
                        Update Company
                    </div>
                </div>
                <div className="widget-body">

                </div>
            </div>
            </div>
        </div>
    }

    render() {
        return <div className="new-transaction">
               { this.props.modals.showing &&  <Modals {...this.props.modals} /> }
               { !this.props.modals.showing && this.renderBody() }
            </div>
    }
}





