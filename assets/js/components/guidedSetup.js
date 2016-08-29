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


import { ApplyShareClassesModal } from './transactions/applyShareClasses';
import { ImportHistoryModal } from './transactions/importHistory';
import { VotingShareholdersModal  } from './transactions/selectVotingShareholders';



@connect(undefined)
export class GuidedSetup extends React.Component {
    constructor(props) {
        super(props);
    }
    componentWillMount() {
        this.checkRedirect(this.props);
    }

    checkRedirect(props) {
        if(!props.children){
            const warnings = getWarnings(props.companyState);
            let location;
            if(warnings.votingShareholderWarning){
                location = 'voting_share_holders';
            }
            if(location){
                props.dispatch(replace(`${props.location.pathname}/${location}`));
            }
        }
    }

    componentWillReceiveProps(newProps) {
        this.checkRedirect(newProps);
    }

    renderModal(showing) {
    }

    handleNext() {
       // this.refs.form.submit();
    }


    render() {
        const props = {
            modalData: {companyId: this.props.companyId, companyState: this.props.companyState},
            next : (...args) => { },
            previous: () => { },
            navigate: (url) => this.props.dispatch(push(url)),
            end: (data) => {

            }
        }
        return <div>
        { this.props.children && React.cloneElement(this.props.children, props) }
        { !this.props.children && <div>

        </div>}
            <div className="container ">
                <div className="widget">
                    <div className=" button-row">
                        <Button bsStyle="success">Next</Button>
                    </div>
                </div>
            </div>
        </div>
    }
}

export const GuidedSetupRoutes = () =>
        <Route path="guided_setup" component={ GuidedSetup }>
            <Route path="apply_share_classes" component={ ApplyShareClassesModal } />
            <Route path="voting_share_holders" component={ VotingShareholdersModal } />
        </Route>
