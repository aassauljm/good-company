"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { numberWithCommas, fieldStyle, fieldHelp, formFieldProps, requireFields, formProxyable, formProxy } from '../utils';
import { pushState } from 'redux-router';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import DateInput from './forms/dateInput';
import Panel from './panel';
import { TransactionView } from './transaction';


const defaultShareClass = '___default';

const issueFields = [
    'effectiveDate',
    'parcels[].amount',
    'parcels[].shareClass',
    'holdings[].holding',
    'holdings[].amount',
    'holdings[].shareClass'
];

function shareClassOptions(shareClasses){
    return shareClasses.filter(x => x.label).map((s, i) => {
            return <option value={s.value} key={i}>{s.label}</option>
        });
}

function holdingOptions(holdings){
    const holdingLabel = (holding) => {
        return holding.holders.map(h => h.name).join(', ');
    }
    return holdings.map((holding, i) => {
        return <option value={holding.holdingId} key={i}>{holdingLabel(holding)}</option>
    })
}


@formFieldProps({
    labelClassName: 'col-xs-3',
    wrapperClassName: 'col-xs-9'
})
export class ParcelFields extends React.Component {
  static propTypes = {
        amount: PropTypes.object.isRequired,
        shareClass: PropTypes.object.isRequired,
        shareClasses: PropTypes.array.isRequired
    };

    render() {
        return <Panel title={'Parcel'} remove={this.props.remove} panelType="warning">
              <Input type="number" {...this.formFieldProps('amount')}  />
               <Input type="select"  {...this.formFieldProps('shareClass')} >
                { shareClassOptions(this.props.shareClasses) }
                </Input>
            </Panel>
    }
}

@formFieldProps({
    labelClassName: 'col-xs-3',
    wrapperClassName: 'col-xs-9'
})
export class HoldingParcelFields extends React.Component {
  static propTypes = {
        amount: PropTypes.object.isRequired,
        shareClass: PropTypes.object.isRequired,
        shareClasses: PropTypes.array.isRequired,
        holdings: PropTypes.array.isRequired
    };

    render() {
        return <Panel title={'Shareholding'} remove={this.props.remove} panelType="info">
                  <Input type="number" {...this.formFieldProps('amount')}  />
                   <Input type="select"  {...this.formFieldProps('shareClass')} >
                    { shareClassOptions(this.props.shareClasses) }
                    </Input>
                   <Input type="select"  {...this.formFieldProps('holding')}>
                    <option value={-1}>Select Holding...</option>
                    { holdingOptions(this.props.holdings) }
                    </Input>
                </Panel>
    }
}

@formProxyable
@formFieldProps({
    labelClassName: 'col-xs-3',
    wrapperClassName: 'col-xs-9'
})
export class IssueForm extends React.Component {
    static propTypes = {
        holdings: PropTypes.array.isRequired,
    };

    renderRemaining() {
        if(this.props.error && this.props.error.remainder){
            return Object.keys(this.props.error.remainder).map(r => {
                return <div key={r}>
                    <div className="alert alert-danger">
                        <span >There are <strong>{ this.props.error.remainder[r] }</strong> shares of class {r === defaultShareClass ? STRINGS.defaultShareClass : r } shares left to allocate.</span>
                    </div>
                </div>
            });
        }
    }

    renderParcelErrors() {
        if(this.props.error && this.props.error.parcels){
            return  <div className="alert alert-danger">
                        <span>Must include at least one share parcel.</span>
                    </div>
        }
    }
    render() {
        const parcels = this.props.fields.parcels.map((parcel, index) => <div key={index}>
            <ParcelFields shareClasses={[{label: STRINGS.defaultShareClass, value: defaultShareClass}]} {...parcel }
            remove={() => this.props.fields.parcels.removeField(index)}/>
            </div>);
        const holdings = this.props.fields.holdings.map((holding, index) => <div key={index}>
            <HoldingParcelFields shareClasses={[{label: STRINGS.defaultShareClass, value: defaultShareClass}]}
                holdings={ this.props.holdings } {...holding }
                remove={() => this.props.fields.holdings.removeField(index)}/>
            </div>);
        return <form className='form-horizontal'>
            <fieldset>
            <legend>Issue Specifics</legend>
                <DateInput {...this.formFieldProps('effectiveDate') }/>
                <div className="row">
                    <div className="col-md-6">
                        { parcels.slice(0, Math.ceil(parcels.length/2)) }
                    </div>
                    <div className="col-md-6">
                        { parcels.slice(Math.ceil(parcels.length/2)) }
                    </div>
                    <div className="text-center">
                        <Button bsStyle='primary' onClick={event => {
                            event.preventDefault();
                            this.props.fields.parcels.addField();
                        }} >Add Parcel</Button>
                    </div>
                </div>
                { this.renderParcelErrors() }
            </fieldset>
             <fieldset>
            <legend>Shareholders</legend>

                <div className="row">
                    <div className="col-md-6">
                        { holdings.slice(0, Math.ceil(holdings.length/2)) }
                    </div>
                    <div className="col-md-6">
                        { holdings.slice(Math.ceil(holdings.length/2)) }
                    </div>
                    <div className="text-center">
                        <Button bsStyle='primary' onClick={event => {
                            event.preventDefault();
                            this.props.fields.holdings.addField();
                        }} >Add Parcel to Shareholding</Button>
                    </div>
                </div>
                { this.renderRemaining() }
            </fieldset>
        </form>
    }
}

const validateIssue = data => {
    const remainder = {};
    data.parcels.map(p => {
        remainder[p.shareClass || defaultShareClass] = (remainder[p.shareClass || defaultShareClass] || 0) + (parseInt(p.amount, 10) || 0);
    });
    data.holdings.map(h => {
        remainder[h.shareClass || defaultShareClass] = (remainder[h.shareClass || defaultShareClass] || 0) - (parseInt(h.amount, 10) || 0);
    });
    const formErrors = {};
    if(Object.values(remainder).some(e => e)){
        formErrors.remainder = remainder;
    }
    if(!data.parcels.length){
        formErrors.parcels = ['Required'];
    }

    const classes = {};
    return { ...requireFields('effectiveDate')(data),
        parcels: data.parcels.map(p => {
            const errors = requireFields('amount')(p);
            if(!p.amount || !parseInt(p.amount, 10)){
                errors.amount = ['Required'];
            }
            if(classes[p.shareClass || defaultShareClass]){
                errors.shareClass = ['Duplicate Share class'];
            }
            classes[p.shareClass || defaultShareClass] = true;
            return errors;
        }),
        holdings: data.holdings.map(h => {
            const errors = requireFields('amount', 'holding')(h);
            if(!h.amount || !parseInt(h.amount, 10)){
                errors.amount = ['Required'];
            }
            if(h.holding === '-1'){
                errors.holding = ['Required'];
            }
            return errors;
        }), _error: Object.keys(formErrors).length ? formErrors: null };
}


const now = new Date()
export const IssueFormConnected = reduxForm({
    form: 'issue', fields: issueFields, validate: validateIssue
}, state => ({
    initialValues: {effectiveDate: now, parcels: [{amount: 1}], holdings: [{amount:1, holding: '10002'}]}
}))(IssueForm);



@formProxy
export class IssueModal extends React.Component {

    static propTypes = {
        modalData: PropTypes.object.isRequired,
    };

    componentWillUnmount() {
        this.refs.modal._onHide();
    }
    pages = [
        function(){
            return <IssueFormConnected
                    holdings={this.props.modalData.companyState.holdings }
                    register={this.register()}
                    unregister={this.unregister()}/>
        },
        function(){
            const effectiveDate = this.props.modalData.transaction.effectiveDate;
            const transaction = {
                effectiveDate: effectiveDate,
                type: 'COMPOUND',
                subTransactions: [
                    ...this.props.modalData.transaction.parcels.map(p => ({
                        type: 'ISSUE',
                        effectiveDate: effectiveDate,
                        data: p
                    })),
                    ...this.props.modalData.transaction.holdings.map(h => ({
                        type: 'ISSUE_TO',
                        effectiveDate: effectiveDate,
                        data: {
                            afterHolders: h.holders,
                            ...h
                        }
                    }))
                ]
            }
            return <div>
                <TransactionView transaction={transaction} />
            </div>
        }
    ];

    handleNext(e) {
        e.preventDefault();
        if(this.props.index === 0){
            this.touchAll();
            if(this.isValid()){
                const values = this.getValues();
                //massage
                values.parcels.map(p => {
                    if(p.shareClass === defaultShareClass){
                        p.shareClass = undefined;
                    }
                });
                values.holdings.map(h => {
                    if(h.shareClass === defaultShareClass){
                        h.shareClass = undefined;
                    }
                    h.holdingId = parseInt(h.holding, 10);
                    h.holders = this.props.modalData.companyState.holdings.filter(f=>{
                        return f.holdingId === h.holdingId;
                    })[0].holders;
                });
                this.props.next({
                    transaction: values,
                    companyState: this.props.modalData.companyState
                });
            }
        }
    }

    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Issue Shares</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                   { this.pages[this.props.index].call(this) }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.props.end} >Close</Button>
                 <Button onClick={::this.handleNext} bsStyle="primary">{ this.props.index < this.pages.length -1 ? 'Next' : 'Submit' }</Button>
              </Modal.Footer>
            </Modal>
    }

}