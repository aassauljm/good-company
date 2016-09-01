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
import { getWarnings } from './company'
import { nextModal, previousModal, endCreateCompany, endImportCompany, endModal, showModal } from '../actions';
import { ModalSwitch }  from './modals';
/*
import { ApplyShareClassesModal } from './transactions/applyShareClasses';
import { ImportHistoryModal } from './transactions/importHistory';
import { VotingShareholdersModal  } from './transactions/selectVotingShareholders';
*/


const DEFAULT_OBJ = {};
@connect(state => ({modals: state.modals || DEFAULT_OBJ}))
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
                props.dispatch(showModal('votingShareholders', {companyId: props.companyId, companyState: props.companyState}));
            }
            else if(warnings.shareClassWarning){
                props.dispatch(showModal('manageShareClasses', {companyId: props.companyId, companyState: props.companyState}));
            }
            else if(warnings.applyShareClassWarning){
                props.dispatch(showModal('applyShareClasses', {companyId: props.companyId, companyState: props.companyState}));
            }
            else if(warnings.historyWarning){
                props.dispatch(showModal('importHistory', {companyId: props.companyId, companyState: props.companyState}));
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
        const warningSteps =  Object.keys(GuidedSetup.warningCounts).reduce((acc, key) => {
            return acc + GuidedSetup.warningCounts[key];
        }, 0);
        const now = ((warningSteps - warningCount) / warningSteps * 100).toFixed(0);
        const props = {
            index: data.index,
            modalData: data.data || {},
            next : (...args) => {this.props.dispatch(nextModal(this.props.modals.showing, ...args))},
            previous: () => {this.props.dispatch(previousModal(this.props.modals.showing))},
            show: (key, extraData) => this.props.dispatch(showModal(key, {...data.data, ...extraData})),
            navigate: (url) => this.props.dispatch(push(url)),
            end: (data) => {
                const after = ((this.props.modals[this.props.modals.showing] || {}).data || {}).afterClose;
                this.props.dispatch(endModal(this.props.modals.showing, data));

                if(after){
                    if(after.showModal){
                        this.props.dispatch(showModal(after.showModal.key, after.showModal.data));
                    }
                }

            }
        }

        if(props.modalData.loadCompanyState){
            props.modalData = {...props.modalData, companyState: this.props.companyState, companyId: this.props.companyId};
        }


        return <div className="modals">
            { this.props.modals.showing && <div>
                <div className="container">
                    <div className="row">
                    <div className="widget">
                         <div className="widget-body">
                            < h5 className="text-center">Company Setup {warningSteps - warningCount} / {warningSteps}</h5>
                            <ProgressBar now={now} striped bsStyle="success" /></div>
                        </div>
                    </div>
                </div>
                <ModalSwitch showing={this.props.modals.showing} {...props}  />
            </div>

            }

            { !this.props.modals.showing &&  <div className="container">
                <div className="row">
                <div className="widget">
                    <div className="widget-header">
                        <div className="widget-title">
                            Guided Setup
                        </div>
                    </div>
                    <div className="widget-body">
                       Congratulations, { this.props.companyState.companyName } has succesfully been setup up.
                    </div>
                </div>
                </div>
            </div> }
        </div>
    }
}

