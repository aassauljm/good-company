"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { importCompany, addNotification, requestResource } from '../actions';
import { reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { fieldStyle, fieldHelp, requiredFields, formFieldProps } from '../utils';
import { push } from 'react-router-redux'
import LookupCompany from './lookupCompany';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';




export class ImportMenu extends React.Component {

    render() {
        const valid = false;
        return <div className="container">
                <div className="row">
                <div className="widget">
                    <div className="widget-header">
                        <div className="widget-title">
                            Bulk Import from the New Zealand Companies Office
                        </div>
                    </div>
                    <div className="widget-body">
                    </div>
                </div>
                </div>
            </div>
    }
}

const ImportMenuConnected = connect(state => ({}))(ImportMenu);
export default ImportMenuConnected;