"use strict";
import React, {PropTypes} from 'react';
import Modal from './forms/modal';
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
import { nextContextualModal, previousContextualModal, endContextualModal, showContextualModal, requestResource } from '../actions';
import { ModalSwitch }  from './modals';
import { requestAlerts } from './alerts';

const DEFAULT_OBJ = {};

@connect(state => ({alerts: state.resources['/alerts'] ||  DEFAULT_OBJ}))
export class NextCompanyControls extends React.Component {

    componentWillMount() {
        this.fetch();
    }

    componentDidUpdate() {
        this.fetch();
    }

    fetch() {
        return this.props.dispatch(requestAlerts())
    }

    render() {
        if(this.props.alerts._status !== 'complete'){
            return false;
        }
        const name = this.props.companyName || '';
        const comp = {companyName: name};
        const data = [...this.props.alerts.data.alertList.filter(a => Object.keys(a.warnings).some(k => a.warnings[k])), comp]
        data.sort((a, b) => {
            return a.companyName.localeCompare(b.companyName);
        })


        //const index = (data.findIndex(a => a === comp) + 1) % data.length;
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
                            <Link className="btn btn-info" to={`/company/view/${data[index].id}/guided_setup`}>{ this.props.showSkip && 'Skip and '}Setup {data[index].companyName} <Glyphicon glyph="forward" className="big-icon"/></Link>
                        </div>
                    </div>
                </div>
            </div>


    }

}


@connect((state, ownProps) => ({modals: state.contextualModals[ownProps.companyId] || DEFAULT_OBJ}))
export class GuidedSetup extends React.Component {
    static warningCounts = {
        votingShareholderWarning: 1,
        shareClassWarning: 2,
        applyShareClassWarning: 1,
        historyWarning: 1
    };

    constructor(props) {
        super(props);
    }
    componentWillMount() {
        this.checkOpenNext(this.props);
    }

    checkOpenNext(props) {
        if(!props.modals.showing){
            const warnings = getWarnings(props.companyState);
            if(warnings.votingShareholderWarning){
                props.dispatch(showContextualModal(props.companyId, 'votingShareholders', {companyId: props.companyId, companyState: props.companyState}));
            }
            else if(warnings.shareClassWarning){
                props.dispatch(showContextualModal(props.companyId, 'manageShareClasses', {companyId: props.companyId, companyState: props.companyState}));
            }
            else if(warnings.applyShareClassWarning){
                props.dispatch(showContextualModal(props.companyId, 'applyShareClasses', {companyId: props.companyId, companyState: props.companyState}));
            }
            else if(warnings.historyWarning){
                props.dispatch(showContextualModal(props.companyId, 'importHistory', {companyId: props.companyId, companyState: props.companyState}));
            }
        }
    }

    componentWillReceiveProps(newProps) {
        this.checkOpenNext(newProps);
    }


    render() {
        const data = this.props.modals[this.props.modals.showing] || {};
        const warnings = getWarnings(this.props.companyState);
        const warningCount = Object.keys(warnings).reduce((acc, key) => {
            return acc + (warnings[key] ? GuidedSetup.warningCounts[key] : 0);
        }, 0);
        const warningSteps  =  Object.keys(GuidedSetup.warningCounts).reduce((acc, key) => {
            return acc + GuidedSetup.warningCounts[key];
        }, 0);
        const now = ((warningSteps - warningCount) / warningSteps * 100);
        const props = {
            index: data.index,
            modalData: {...data.data, companyId: this.props.companyId, companyState: this.props.companyState},
            next : (...args) => {this.props.dispatch(nextContextualModal(this.props.companyId, this.props.modals.showing, ...args))},
            previous: () => {this.props.dispatch(previousContextualModal(this.props.companyId, this.props.modals.showing))},
            show: (key, extraData) => this.props.dispatch(showContextualModal(this.props.companyId, key, {...data.data, ...extraData})),
            navigate: (url) => this.props.dispatch(push(url)),
            end: (data) => {
                const after = ((this.props.modals[this.props.modals.showing] || {}).data || {}).afterClose;
                this.props.dispatch(endContextualModal(this.props.companyId, this.props.modals.showing, data));

                if(after){
                    if(after.showModal){
                        this.props.dispatch(showContextualModal(this.props.companyId, after.showModal.key, after.showModal.data));
                    }
                }

            }
        }

        if(props.modalData.loadCompanyState){
            props.modalData = {...props.modalData, companyState: this.props.companyState, companyId: this.props.companyId};
        }

        return <div className="modals">
            <div>
                <div className="container">
                    <div className="row">
                    <div className="col-md-12">
                    <div className="widget">
                        <div className="widget-header">
                        <div className="widget-title">
                            Guided Setup
                        </div>
                        </div>
                         <div className="widget-body">
                            <h5 className="text-center">Share Register Setup {warningSteps - warningCount} / {warningSteps}</h5>
                            <ProgressBar now={now} striped bsStyle="success" /></div>
                            { warningCount === 0 && <p>Congratulations, { this.props.companyState.companyName } has succesfully been setup up.</p> }
                        </div>
                    </div>
                    </div>
                </div>
                { this.props.modals.showing && <ModalSwitch showing={this.props.modals.showing} {...props}  /> }
            </div>
            <NextCompanyControls companyId={this.props.companyId} companyName={this.props.companyState.companyName} showSkip={warningCount !== 0}/>
        </div>
    }
}

