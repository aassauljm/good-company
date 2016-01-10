"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from '../forms/input';
import STRINGS from '../../strings'
import { numberWithCommas, fieldStyle, fieldHelp, formFieldProps, requireFields, formProxyable, formProxy } from '../../utils';
import { pushState } from 'redux-router';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import DateInput from '../forms/dateInput';
import Panel from '../panel';
import { TransactionView } from '../transaction';
import { companyTransaction, addNotification } from '../../actions';

const defaultShareClass = '___default';

const transferFields = [
    'effectiveDate',
    'parcels[].amount',
    'parcels[].shareClass',
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


//TODO, holdings should have list of parcels to add
@formFieldProps({
    labelClassName: 'col-xs-3',
    wrapperClassName: 'col-xs-9'
})
export class HoldingFields extends React.Component {
  static propTypes = {
        shareClasses: PropTypes.array.isRequired,
        holdings: PropTypes.array.isRequired,
        holding: PropTypes.object.isRequired,
        parcels: PropTypes.array.isRequired
    };

    render() {
        return <Panel title={'Shareholding'} remove={this.props.remove} panelType="info">
                   <Input type="select"  {...this.formFieldProps('holding')}>
                    <option value={-1}>Select Holding...</option>
                        { holdingOptions(this.props.holdings) }
                    </Input>
                    { this.props.parcels.map((p, i) => {
                        return <ParcelFields key={i} amount={p.amount} shareClass={p.shareClass} shareClasses={this.props.shareClasses} remove={() =>  this.props.parcels.removeField(i)}/>
                    }) }
                    <div className="text-center">
                        <Button bsStyle='primary' onClick={event => {
                            event.preventDefault();
                            this.props.parcels.addField();
                        }} >Add Parcel</Button>
                    </div>
                </Panel>
    }
}

@formProxyable
@formFieldProps({
    labelClassName: 'col-xs-3',
    wrapperClassName: 'col-xs-9'
})
export class TransferForm extends React.Component {
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
            <HoldingFields shareClasses={[{label: STRINGS.defaultShareClass, value: defaultShareClass}]}
                holdings={ this.props.holdings } {...holding }
                remove={() => this.props.fields.holdings.removeField(index)}/>
            </div>);
        return <form className='form-horizontal'>
            <fieldset>
            <legend>Issue Specifics</legend>
                <DateInput {...this.formFieldProps('effectiveDate') }/>


                        { parcels.slice(0, Math.ceil(parcels.length/2)) }

                    <div className="text-center">
                        <Button bsStyle='primary' onClick={event => {
                            event.preventDefault();
                            this.props.fields.parcels.addField();
                        }} >Add Parcel</Button>
                    </div>
                { this.renderParcelErrors() }
            </fieldset>
             <fieldset>
            <legend>Shareholders</legend>
                    { holdings }

                <div className="text-center">
                    <Button bsStyle='primary' onClick={event => {
                        event.preventDefault();
                        this.props.fields.holdings.addField();
                    }} >Add Shareholding</Button>
                </div>

                { this.renderRemaining() }
            </fieldset>
        </form>
    }
}

const validateTransfer = data => {
    const remainder = {};
    data.parcels.map(p => {
        remainder[p.shareClass || defaultShareClass] = (remainder[p.shareClass || defaultShareClass] || 0) + (parseInt(p.amount, 10) || 0);
    });
    data.holdings.map(h => {
        h.parcels.map(p => {
             remainder[p.shareClass || defaultShareClass] = (remainder[p.shareClass || defaultShareClass] || 0) - (parseInt(p.amount, 10) || 0);
        })

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
            const classes = {};
            const errors = requireFields('holding')(h);
            errors.parcels = h.parcels.map(p => {
                const errors = {};
                if(!p.amount || !parseInt(p.amount, 10)){
                    errors.amount = ['Required'];
                }
                if(classes[p.shareClass || defaultShareClass]){
                    errors.shareClass = ['Duplicate Share class'];
                }
                classes[p.shareClass || defaultShareClass] = true;
                return errors;
            })
            if(h.holding === '-1'){
                errors.holding = ['Required'];
            }
            return errors;
        }), _error: Object.keys(formErrors).length ? formErrors: null };
}


const now = new Date()
export const TransferFormConnected = reduxForm({
    form: 'transfer', fields: transferFields, validate: validateTransfer
}, state => ({
    initialValues: {effectiveDate: now, parcels: [{}]}
}))(TransferForm);



const dummy = {};


@connect(state => dummy)
@formProxy
export default class TransferModal extends React.Component {

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
            const issueTo = [];
            this.props.modalData.transaction.holdings.map(h => {
                h.parcels.map(p => {
                    issueTo.push({
                        type: 'ISSUE_TO',
                        effectiveDate: effectiveDate,
                        data: {
                            amount: p.amount,
                            shareClass: p.shareClass,
                            holders: h.holders
                        }});
                })
            });
            const transaction = {
                effectiveDate: effectiveDate,
                type: 'ISSUE',
                subTransactions: [
                    ...this.props.modalData.transaction.parcels.map(p => ({
                        type: 'ISSUE_UNALLOCATED',
                        effectiveDate: effectiveDate,
                        data: p
                    })),
                    ...issueTo
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
                const parcels = values.parcels.map(p => {
                    if(p.shareClass === defaultShareClass){
                        p.shareClass = undefined;
                    }
                    return p;
                });
                const holdings = values.holdings.map(h => {
                    const holdingId = parseInt(h.holding, 10);
                    return {
                        holdingId:  holdingId,
                        parcels: h.parcels.map(p=>{
                            const shareClass = p.shareClass === defaultShareClass ? undefined : p.shareClass;
                            return {amount: parseInt(p.amount, 10), shareClass: shareClass}
                        }),
                        holders: this.props.modalData.companyState.holdings.filter(f=>{
                            return f.holdingId === holdingId;
                        })[0].holders
                    }
                });

                this.props.next({
                    transaction: {parcels, holdings, effectiveDate: values.effectiveDate},
                    companyId: this.props.modalData.companyId,
                    companyState: this.props.modalData.companyState
                });
            }
        }
        else{
            this.props.dispatch(companyTransaction('issue',
                                this.props.modalData.companyId,
                                this.props.modalData.transaction))
                    .then((r) => {
                        if(r.error){
                            return this.props.dispatch(addNotification({message: r.response.message, error: r.error}));
                        }
                        else{
                            return this.props.dispatch(addNotification({message: 'Shares Issued'}));
                        }
                    })
                    .then(() => this.props.end())
        }
    }

    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Transfer Shares</Modal.Title>
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