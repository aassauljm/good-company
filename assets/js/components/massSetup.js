"use strict";
import React, {PropTypes} from 'react';
import { ShareClassCreate } from './shareClasses';
import { connect } from 'react-redux';
import { push } from 'react-router-redux'
import { requestResource, resetModals, nextModal, showModal, transactionBulk, addNotification } from '../actions';
import { formFieldProps } from '../utils';
import { Link } from 'react-router';
import Input from './forms/input';
import { sortAlerts } from './alerts';
import { reduxForm } from 'redux-form';
import ButtonInput from './forms/buttonInput';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { enums as BulkTransactionTypes } from '../../../config/enums/bulkTransactions';

const CREATE_SHARE = 0;
const SELECT_COMPANIES = 1;
const FINALIZE = 2;
const SUBMIT = 3;

@formFieldProps()
class SelectCompanies extends React.Component {
    render() {
        const { handleSubmit, fields, invalid } = this.props;
        return <form onSubmit={handleSubmit}>
            { fields.companies.map((company, i) => {
                return <Input key={i} type="checkbox"  {...this.formFieldProps(['companies', i, 'selected'])} label={company.companyName.value} />
            }) }
            <div className="button-row">
                <ButtonInput onClick={() => fields.companies.map(c => c.selected.onChange(true) )} >Select All</ButtonInput>
                <ButtonInput onClick={() => fields.companies.map(c => c.selected.onChange(false) )} >Unselect All</ButtonInput>
                <ButtonInput type="submit" bsStyle="primary" disabled={ invalid}>Next</ButtonInput>
            </div>
        </form>
    }
}


const SelectCompaniesConnected = reduxForm({
  form: 'selectCompanies',
  fields: [
    'companies[].selected',
    'companies[].companyId',
    'companies[].companyName'
  ],
  validate: (values) => {
    const errors = {};
    if(!values.companies.some(c => c.selected)){
        errors._error = ['Please select at least one company']
    }
    return errors;
  }
})(SelectCompanies);

const MassSetupLoading = (props) => {
    return <div>
            <div className="row">
                <div className="col-md-12">
                    <div className="widget">
                        <div className="widget-header">
                            <div className="widget-title">
                                Mass Share Register Setup
                            </div>
                        </div>
                        <div className="widget-body">
                                <div className="loading"> <Glyphicon glyph="refresh" className="spin"/></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
}

const PAGES = {
    [CREATE_SHARE]: (props) => {
        return <div>
            <div className="row">
                <div className="col-md-12">
                    <div className="widget">
                        <div className="widget-header">
                            <div className="widget-title">
                                Mass Share Register Setup
                            </div>
                        </div>
                        <div className="widget-body">
                            This tool is designed to create and assign similiar share classes to many companies that have only a single type of share.<br/>
                            To begin, fill out the details for the share class below.
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-12">
                    <div className="widget">
                        <div className="widget-header">
                            <div className="widget-title">
                                Mass Create Share Class
                            </div>
                        </div>
                        <div className="widget-body">
                            <ShareClassCreate submit={(values) => props.next({index: SELECT_COMPANIES, shareClass: values} )}  noDocuments={true}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    },

    [SELECT_COMPANIES]: (props) => {
        const alerts = props.alerts.data || [];
        alerts.sort((a, b) => (a.companyName || '').localeCompare(b.companyName));

        const initialValues = {companies: alerts
                                    .filter(a => a.warnings.shareClassWarning)
                                    .map(c => ({companyName: c.companyName, companyId: c.id}) )}

        return <div>

            <div className="row">
                <div className="col-md-12">
                    <div className="widget">
                        <div className="widget-header">
                            <div className="widget-title">
                                Mass Share Register Setup
                            </div>
                        </div>
                        <div className="widget-body">
                        Next, select each company that has the "<strong>{props.massSetup.data.shareClass.name}</strong>" share class.
                        </div>
                    </div>
                </div>
            </div>


            <div className="row">
                <div className="col-md-12">
                    <div className="widget">
                        <div className="widget-header">
                            <div className="widget-title">
                                Select Companies
                            </div>
                        </div>
                        <div className="widget-body">
                            <div className="row">
                                <div className="col-md-6 col-md-offset-3">
                                    <SelectCompaniesConnected initialValues={initialValues}
                                        onSubmit={(values) => props.next({index: FINALIZE, companies: values.companies.filter(c => c.selected)} )}
                                        />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    },


    [FINALIZE]: (props) => {
        return <div>

            <div className="row">
                <div className="col-md-12">
                    <div className="widget">
                        <div className="widget-header">
                            <div className="widget-title">
                                Mass Share Register Setup
                            </div>
                        </div>
                        <div className="widget-body">
                            <p>Clicking submit will add a new share class "<strong>{props.massSetup.data.shareClass.name}</strong>"
                            to the companies show before, apply the share class to every current share allocation, then being the historic transaction import process.</p>
                            <p>Importing historic transactions can take some time, so you will be emailed when the process is complete.</p>
                            <div className="row">
                                <div className="col-md-6 col-md-offset-3">
                                    <ul className="bulleted">
                                    { props.massSetup.data.companies.map((company, i) => {
                                        return <li key={i}>{company.companyName}</li>
                                    })}
                                    </ul>
                                </div>
                                </div>
                                <div className="button-row">
                                    <ButtonInput type="submit" bsStyle="primary" onClick={() => props.submit(props.massSetup.data).then(props.done).catch(props.error) }>Submit</ButtonInput>
                                </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }

}


@connect((state, ownProps) => {
    return {alerts: state.resources['/alerts'] || {}, massSetup: state.modals.massSetup || {}, transactionBulk: state.transactionBulk};
}, (dispatch, props) => ({
        requestData: (key) => dispatch(requestResource('/alerts', {postProcess: sortAlerts})),
        next: (data) => dispatch(nextModal('massSetup', data)),
        showModal: () => dispatch(showModal('massSetup')),
        submit: (data) => {
            return dispatch(transactionBulk({
                transactions: data.companies.map(c => ({
                    companyId: c.companyId,
                    transactions: [{
                        data: data.shareClass,
                        transactionType: BulkTransactionTypes.CREATE_APPLY_ALL_SHARE_CLASS
                    }, {
                        transactionType: BulkTransactionTypes.IMPORT_HISTORY
                    }]
                }))

            }))
        },
        done: () => {
            dispatch(push('/'));
            dispatch(addNotification({message: 'Share Class and History Import begun'}))
        },
        error: (response) => {
            dispatch(addNotification({message: 'Could not mass assign share classes. Reason: '+response.message, error: true}))
        }
    })
)
export class MassSetup extends React.Component {

    fetch() {
        this.props.requestData();
        this.props.showModal()

    }

    componentDidMount() {
        this.fetch();
    }

    render() {
        if(this.props.massSetup._status === 'fetching' || this.props.transactionBulk._status === 'fetching'){
            return <MassSetupLoading />;
        }
        return PAGES[this.props.massSetup.index || 0]({...this.props})
    }
}
