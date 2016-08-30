"use strict";
import React, {PropTypes} from 'react';
import Modal from './forms/modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { fieldStyle, fieldHelp, populatePerson, numberWithCommas } from '../utils';
import { Link } from 'react-router';
import { push, replace } from 'react-router-redux';
import LawBrowserLink from './lawBrowserLink';
import { Route } from 'react-router';
import { getWarnings } from './company'
import { nextModal, previousModal, endCreateCompany, endImportCompany, endModal, showModal } from '../actions';
import { ModalSwitch }  from './modals'
/*
import { ApplyShareClassesModal } from './transactions/applyShareClasses';
import { ImportHistoryModal } from './transactions/importHistory';
import { VotingShareholdersModal  } from './transactions/selectVotingShareholders';
*/


const DEFAULT_OBJ = {};
@connect(state => ({modals: state.modals || DEFAULT_OBJ}))
export class GuidedSetup extends React.Component {
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
                        this.props.dispatch(showModal(after.showModal.key, {companyId: this.props.companyId, companyState: this.props.companyState}));
                    }
                }

            }
        }

        if(!props.modalData.historic){
            props.modalData = {...props.modalData, companyId: this.props.companyId, companyState: this.props.companyState};
        }


        return <div className="modals">
            { this.props.modals.showing && <ModalSwitch showing={this.props.modals.showing} {...props}  /> }

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

