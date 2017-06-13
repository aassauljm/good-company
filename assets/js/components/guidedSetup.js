"use strict";
import React, {PropTypes} from 'react';
import TransactionView from './forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import ProgressBar from 'react-bootstrap/lib/ProgressBar';
import { fieldStyle, fieldHelp, populatePerson, numberWithCommas } from '../utils';
import { Link } from 'react-router';
import { push, replace } from 'react-router-redux';
import LawBrowserLink from './lawBrowserLink';
import { Route } from 'react-router';
import { getWarnings } from './companyAlerts'
import { nextContextualTransactionView, previousContextualTransactionView, endContextualTransactionView, showContextualTransactionView, requestResource } from '../actions';
import { TransactionViewSwitch }  from './transactionViews';
import { requestAlerts } from './alerts';
import Widget from './widget';
import LawBrowserContainer from './lawBrowserContainer';
import { AlertsHOC } from '../hoc/resources'
import Dropdown from 'react-bootstrap/lib/Dropdown';
import MenuItem from 'react-bootstrap/lib/MenuItem';


const DEFAULT_OBJ = {};

const BASE_GUIDED_SETUP_PAGES = [
'votingShareholders',
'manageShareClasses',
'applyShareClasses',
'importHistory']


@connect(undefined, {
    nav: (args) => push(args)
})
@AlertsHOC()
export class NextCompanyControls extends React.Component {

    render() {
        if(this.props.alerts._status !== 'complete'){
            return false;
        }
        const name = this.props.companyName || '';
        const comp = {companyName: name};
        // this company might be no longer in list
        const data = [...this.props.alerts.data.alertList.filter(this.props.filter), comp]
        data.sort((a, b) => {
            return a.companyName.localeCompare(b.companyName);
        })


        let index = (data.findIndex(a => a === comp) + 1)  % data.length;;
        let count = 0;
        while(data[index].companyName === name && count++ < data.length){
            index = (index + 1) % data.length;
        }
        if(data[index].companyName === name){
            return false;
        }

        return <div className="container">
                    <div className="row">
                    <div className="col-md-12">
                         <div className="button-row">
                            <div className="btn-group">
                               <Dropdown id="next-control" >

                               <Button  bsRole="toggle" className="btn btn-info"><span className="caret"></span></Button>

                                <Dropdown.Menu bsRole="menu" >
                                     { data.filter(d => d.id).map((d, i) =>
                                        <MenuItem key={d.id} onClick={() => this.props.nav(`/company/view/${d.id}/${this.props.subPath}?show_next=true`)}>{ d.companyName }</MenuItem>
                                        )}
                                </Dropdown.Menu>
                            </Dropdown>
                            <Link className="btn btn-info" to={`/company/view/${data[index].id}/${this.props.subPath}?show_next=true`}>{ this.props.showSkip && 'Skip and '}{this.props.verb} {data[index].companyName} <Glyphicon glyph="forward" className="big-icon"/></Link>


                            </div>
                        </div>
                    </div>
                </div>
            </div>

    }
}


@connect((state, ownProps) => ({transactionViews: state.contextualTransactionViews[ownProps.companyId] || DEFAULT_OBJ}))
export class GuidedSetup extends React.PureComponent {
    static warningCounts = {
        votingShareholderWarning: 1,
        shareClassWarning: 2,
        applyShareClassWarning: 1,
        historyWarning: 1
    };

    constructor(props) {
        super(props);
        this.state = this.calcSteps(props);
    }
    componentWillMount() {
        this.checkOpenNext(this.props);
    }

    checkOpenNext(props) {
        if(!props.transactionViews.showing){
            const warnings = getWarnings(props.companyState);
            if(warnings.votingShareholderWarning){
                props.dispatch(showContextualTransactionView(props.companyId, 'votingShareholders', {companyId: props.companyId, companyState: props.companyState}));
            }
            else if(warnings.shareClassWarning){
                props.dispatch(showContextualTransactionView(props.companyId, 'manageShareClasses', {companyId: props.companyId, companyState: props.companyState}));
            }
            else if(warnings.applyShareClassWarning){
                props.dispatch(showContextualTransactionView(props.companyId, 'applyShareClasses', {companyId: props.companyId, companyState: props.companyState}));
            }
            else if(warnings.historyWarning){
                props.dispatch(showContextualTransactionView(props.companyId, 'importHistory', {companyId: props.companyId, companyState: props.companyState}));
            }
        }
    }

    componentWillReceiveProps(newProps) {
        this.checkOpenNext(newProps);
        if(newProps.companyState && newProps.companyState.warnings && Object.keys(newProps.companyState.warnings).length){
            this.setState(this.calcSteps(newProps));
        }
    }

    calcSteps(props) {
        const warnings = getWarnings(props.companyState);
        const warningCount = Object.keys(warnings).reduce((acc, key) => {
            return acc + (warnings[key] && GuidedSetup.warningCounts[key] ? GuidedSetup.warningCounts[key] : 0);
        }, 0);
        const warningSteps  =  Object.keys(GuidedSetup.warningCounts).reduce((acc, key) => {
            return acc + GuidedSetup.warningCounts[key];
        }, 0);
        return {now: ((warningSteps - warningCount) / warningSteps * 100), warningSteps, warningCount};
    }

    render() {
        const data = this.props.transactionViews[this.props.transactionViews.showing] || {};
        const props = {
            index: data.index,
            transactionViewData: {...data.data, companyId: this.props.companyId, companyState: this.props.companyState},
            next : (...args) => {this.props.dispatch(nextContextualTransactionView(this.props.companyId, this.props.transactionViews.showing, ...args))},
            previous: () => {this.props.dispatch(previousContextualTransactionView(this.props.companyId, this.props.transactionViews.showing))},
            show: (key, extraData) => this.props.dispatch(showContextualTransactionView(this.props.companyId, key, {...data.data, ...extraData})),
            navigate: (url) => this.props.dispatch(push(url)),
            end: (data) => {
                const after = ((this.props.transactionViews[this.props.transactionViews.showing] || {}).data || {}).afterClose;
                this.props.dispatch(endContextualTransactionView(this.props.companyId, this.props.transactionViews.showing, data));

                if(after){
                    if(after.showTransactionView){
                        const transData = after.showTransactionView.data;
                        if(data && data.index !== undefined){
                            transData.index = data.index;
                        }
                        this.props.dispatch(showContextualTransactionView(this.props.companyId, after.showTransactionView.key, transData));
                    }
                }
                // perhaps check if the current modal is the any of the base guidedSetup types:  if so, then redirect
                if(data && data.cancelled && BASE_GUIDED_SETUP_PAGES.indexOf(this.props.transactionViews.showing) >= 0){
                    this.props.dispatch(push(`/company/view/${this.props.companyId}`));
                }
            }
        }

        if(props.transactionViewData.loadCompanyState){
            props.transactionViewData = {...props.transactionViewData, companyState: this.props.companyState, companyId: this.props.companyId};
        }
        const showNext = this.props.location.query.show_next;

        return <div className="transactionViews">
            <div>
                <div className="container">
                <Widget title="Guided Setup">
                 <h5 className="text-center">Share Register Setup - Step {this.state.warningSteps - this.state.warningCount} of {this.state.warningSteps}</h5>
                <ProgressBar now={this.state.now} striped bsStyle="success" />
                { this.state.warningCount === 0 && <div>
                    <p className="congratulations">Congratulations, { this.props.companyState.companyName } has succesfully been set up. </p>
                    <div className="button-row"><Link className="btn btn-primary" to={`/company/view/${this.props.companyId}/registers/shareregister`}>View Share Register</Link></div>
                    </div> }
                </Widget>
                </div>


                { !!this.props.transactionViews.showing && <TransactionViewSwitch showing={this.props.transactionViews.showing} {...props}  /> }

            </div>
            { showNext && <NextCompanyControls
                companyId={this.props.companyId}
                subPath={'guided_setup'}
                companyName={this.props.companyState.companyName}
                showSkip={this.state.warningCount !== 0}
                verb='Set up'
                filter={a => Object.keys(a.warnings || {}).some(k => a.warnings[k]) }
                /> }
        </div>
    }
}

