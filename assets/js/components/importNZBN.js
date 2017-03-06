"use strict";
import React, {PropTypes} from 'react';
import TransactionView from './forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { importCompany, addNotification, requestResource } from '../actions';
import { reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { fieldStyle, fieldHelp, requiredFields, formFieldProps } from '../utils';
import { push } from 'react-router-redux'
import Loading from './loading';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';


const DEFAULT_OBJ = {};

@connect(state => ({
    nzbn: state.resources['/nzbn'] || DEFAULT_OBJ
}), {
    requestListCompanies: () => requestResource('/nzbn')
})
export default class ImportNZBN extends React.PureComponent {
    static propTypes = {

    };

    fetch() {
        this.props.requestListCompanies();
    }

    componentDidMount() {
        this.fetch();
    }

    componentWillUpdate() {
        this.fetch();
    }

    renderBody() {
        if(this.props.nzbn._status === 'fetching'){
            return <Loading />
        }
        return;
    }

    renderLoading() {

    }


    render() {
        return <div className="container">
                <div className="widget">
                    <div className="widget-header">
                        <div className="widget-title">
                            Import from the New Zealand Companies Office
                        </div>
                    </div>
                    <div className="widget-body">
                        { this.renderBody() }
                    </div>
                </div>
            </div>
    }
}
