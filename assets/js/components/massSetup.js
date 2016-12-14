"use strict";
import React, {PropTypes} from 'react';
import { ShareClassCreate, shareClassLawLinks } from './shareClasses';
import { connect } from 'react-redux';
import { push } from 'react-router-redux'
import { requestResource, resetTransactionViews, nextTransactionView, showTransactionView, transactionBulk, addNotification } from '../actions';
import { formFieldProps } from '../utils';
import { Link } from 'react-router';
import Input from './forms/input';
import { requestAlerts } from './alerts';
import { reduxForm } from 'redux-form';
import ButtonInput from './forms/buttonInput';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { enums as BulkTransactionTypes } from '../../../config/enums/bulkTransactions';
import LawBrowserContainer from './lawBrowserContainer'


const CREATE_SHARE = 0;
const SELECT_COMPANIES = 1;
const FINALIZE = 2;
const SUBMIT = 3;

@formFieldProps()
class SelectCompanies extends React.Component {
    render() {
        const { handleSubmit, fields, invalid } = this.props;
        return <form onSubmit={handleSubmit}>
            <div className="button-row">
                <ButtonInput onClick={() => fields.companies.map(c => c.selected.onChange(true) )} >Select All</ButtonInput>
                <ButtonInput onClick={() => fields.companies.map((c, i) => this.props.companyData[i].constitutionFiled && c.selected.onChange(true))} >Select All With Constitution</ButtonInput>
                <ButtonInput onClick={() => fields.companies.map((c, i) => !this.props.companyData[i].constitutionFiled && c.selected.onChange(true))} >Select All Without Constitution</ButtonInput>
                <ButtonInput onClick={() => fields.companies.map(c => c.selected.onChange(false) )} >Unselect All</ButtonInput>
            </div>
            <div className="row">
            <div className="col-md-6 col-md-offset-3">
                { fields.companies.map((company, i) => {
                    return <Input key={i} type="checkbox"  {...this.formFieldProps(['companies', i, 'selected'])}
                    label={(<span><strong>{this.props.companyData[i].companyName}</strong>{ this.props.companyData[i].constitutionFiled && ' (Constitution Filed)'} </span>)} />
                }) }
            </div>
            </div>
            <div className="button-row">
                <ButtonInput onClick={() => fields.companies.map(c => c.selected.onChange(true) )} >Select All</ButtonInput>
                <ButtonInput onClick={() => fields.companies.map((c, i) => this.props.companyData[i].constitutionFiled && c.selected.onChange(true))}>Select All With Constitution</ButtonInput>
                <ButtonInput onClick={() => fields.companies.map((c, i) => !this.props.companyData[i].constitutionFiled && c.selected.onChange(true))}>Select All Without Constitution</ButtonInput>
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
    return <LawBrowserContainer>
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
            </LawBrowserContainer>
}

const PAGES = {
    [CREATE_SHARE]: (props) => {
        return <div>
              <LawBrowserContainer>
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
                </LawBrowserContainer>

              <LawBrowserContainer lawLinks={shareClassLawLinks()}>
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
                    </LawBrowserContainer>
        </div>
    },

    [SELECT_COMPANIES]: (props) => {
        const alerts = (props.alerts.data || {}).alertList || [];
        alerts.sort((a, b) => (a.companyName || '').localeCompare(b.companyName));

        const filteredCompanies = alerts
                                    .filter(a => a.warnings.shareClassWarning && !a.warnings.extensiveWarning);
        const initialValues = {companies: filteredCompanies
                                    .map(c => ({companyName: c.companyName, companyId: c.id}) )}

        return <div>

            <LawBrowserContainer>
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
            </LawBrowserContainer>


             <LawBrowserContainer>
                    <div className="widget">
                        <div className="widget-header">
                            <div className="widget-title">
                                Select Companies
                            </div>
                        </div>
                        <div className="widget-body">
                            <SelectCompaniesConnected initialValues={initialValues} companyData={filteredCompanies}
                                onSubmit={(values) => props.next({index: FINALIZE, companies: values.companies.filter(c => c.selected)} )}
                                />
                        </div>
                    </div>
            </LawBrowserContainer>
        </div>
    },


    [FINALIZE]: (props) => {
        const alerts = (props.alerts.data || {}).alertList || [];
        const companyMapping = alerts.reduce((acc, a) => {
            acc[a.id] = a.companyName;
            return acc;
        }, {});
        return <LawBrowserContainer>
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
                                        return <li key={i}>{companyMapping[company.companyId]}</li>
                                    })}
                                    </ul>
                                </div>
                                </div>
                                <div className="button-row">
                                    <ButtonInput type="submit" bsStyle="primary" onClick={() => props.submit(props.massSetup.data).then(props.done).catch(props.error) }>Submit</ButtonInput>
                                </div>
                        </div>
                    </div>
                    </LawBrowserContainer>
        }

}


@connect((state, ownProps) => {
    return {alerts: state.resources['/alerts'] || {}, massSetup: state.transactionViews.massSetup || {}, transactionBulk: state.transactionBulk};
}, (dispatch, props) => ({
        requestData: (key) => dispatch(requestAlerts()),
        next: (data) => dispatch(nextTransactionView('massSetup', data)),
        showTransactionView: () => dispatch(showTransactionView('massSetup')),
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
        this.props.showTransactionView()
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
