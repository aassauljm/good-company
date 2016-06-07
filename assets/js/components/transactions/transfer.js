"use strict";
import React, {PropTypes} from 'react';
import Modal from '../forms/modal';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from 'react-bootstrap/lib/ButtonInput';
import { connect } from 'react-redux';
import { reduxForm, destroy } from 'redux-form';
import Input from '../forms/input';
import DateInput from '../forms/dateInput';
import { formFieldProps, requireFields, joinAnd, newHoldingString } from '../../utils';
import { Link } from 'react-router';
import { companyTransaction, addNotification, showModal } from '../../actions';
import STRINGS from '../../strings';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import StaticField from 'react-bootstrap/lib/FormControls/Static';
import { ParcelWithRemove } from '../forms/parcel';
import { newHoldingFormatAction } from '../forms/holding';
import { Documents } from '../forms/documents';

const fields = [
    'effectiveDate',
    'from',
    'to',
    'newHolding',
    'parcels[].shareClass',
    'parcels[].amount',
    'newHolding',
    'documents'
    ];



@formFieldProps()
export class Transfer extends React.Component {

    static propTypes = {
        holdingOptions: PropTypes.array.isRequired,
        shareOptions: PropTypes.array.isRequired,
        fields: PropTypes.object.isRequired,
    };

    render() {
        return <form className="form" >
        <fieldset>
            <DateInput {...this.formFieldProps('effectiveDate')} />
            <Input type="select" {...this.formFieldProps('from', STRINGS.transfer)} >
                <option></option>
                { this.props.holdingOptions }
            </Input>

            { !this.props.fields.newHolding.value &&
                <div className="or-group"><Input type="select" {...this.formFieldProps('to', STRINGS.transfer)} >
                    <option></option>
                    { this.props.holdingOptions }
                </Input>
                <span className="or-divider">- or -</span>
                <div className="button-row"><ButtonInput className="new-holding" nClick={() => {
                    this.props.showModal('newHolding');
                }}>Create New Holding</ButtonInput></div></div> }

            { this.props.fields.newHolding.value  &&
                <StaticField type="static" label={STRINGS.transfer.to} value={newHoldingString(this.props.fields.newHolding.value)}
                buttonAfter={<button className="btn btn-default" onClick={(e) => {
                    this.props.fields.newHolding.onChange(null);
                }}><Glyphicon glyph='trash'/></button>} /> }


                <label className="control-label">Parcels</label>
             { this.props.fields.parcels.map((p, i) => {
                return <div className="row " key={i}>
                    <ParcelWithRemove fields={p} remove={() => this.props.fields.parcels.removeField(i)} shareOptions={this.props.shareOptions}/>
                </div>
            }) }
            <div className="button-row"><ButtonInput className="add-parcel" onClick={() => {
                this.props.fields.parcels.addField();    // pushes empty child field onto the end of the array
            }}>Add Parcel</ButtonInput></div>
        </fieldset>
        { this.props.error && <div className="alert alert-danger">
            { this.props.error.map((e, i) => <span key={i}> { e } </span>) }
        </div> }
        <Documents documents={this.props.fields.documents}/>

        </form>
    }
}

const validateBase = requireFields('effectiveDate', 'from');

export const validate = (values, props) => {
    const errors = validateBase(values);
    if(values.from && values.from === values.to){
        errors.to = ['Destination must be different from source.']
    }
    if(!values.newHolding && !values.to){
        errors['to'] = ['Required.']
    }
    const parcels = [];
    errors.parcels = values.parcels.map((p, i) => {
        const errors = {};
        const sourceParcels = props.holdingMap[values.from];
        const shareClass = parseInt(p.shareClass, 10) || null;
        const amount = parseInt(p.amount, 10);
        if(!amount){
            errors.amount = (errors.amount || []).concat(['Required.']);
        }
        else if(amount <= 0){
            errors.amount = (errors.amount || []).concat(['Must be greater than 0.']);
        }
        if(parcels.indexOf(shareClass) >= 0){
            errors.shareClass = (errors.shareClass || []).concat(['Duplicate share class.']);
        }
        parcels.push(shareClass);
        const matchedParcels = sourceParcels && sourceParcels.filter(sP => {
            if(sP.shareClass === shareClass && amount > sP.amount){
                errors.amount = (errors.amount || []).concat(['Insufficient shares in source holding.']);
            }
            return sP.shareClass === shareClass;
        })
        if(matchedParcels && !matchedParcels.length){
            errors.shareClass = (errors.shareClass || []).concat(['Source does not have any parcels of this share class.']);
        }
        return errors;
    });
    if(!values.parcels.length){
        errors._error = (errors._error || []).concat(['At least 1 parcel required.'])
    }
    return errors;

}

export function createHoldingMap(companyState){
    return companyState.holdingList.holdings.reduce((acc, val) => {
        acc[`${val.holdingId}`] = val.parcels.map(p => ({ amount: p.amount, shareClass: p.shareClass || null }));
        return acc;
    }, {});
}


export function transferFormatSubmit(values, companyState){
    const actions = [], results = []
    const amounts = companyState.holdingList.holdings.reduce((acc, holding) => {
        acc[`${holding.holdingId}`] = holding.parcels.reduce((acc, parcel) => {
            acc[parcel.shareClass || undefined] = parcel.amount;
            return acc;
        }, {})
        return acc;
    }, {})

    values.parcels.map(p => {
        const amount = parseInt(p.amount, 10);
        const shareClass = parseInt(p.shareClass, 10) || null;
        actions.push({
            holdingId: parseInt(values.from, 10),
            shareClass: shareClass,
            amount: amount,
            beforeAmount: amounts[values.from][p.shareClass],
            afterAmount: (amounts[values.from][p.shareClass]) - amount,
            transactionType: 'TRANSFER_FROM',
            transactionMethod: 'AMEND'
        });
        if(!values.newHolding){
            actions.push({
                holdingId: parseInt(values.to, 10),
                shareClass: shareClass,
                amount: amount,
                beforeAmount: amounts[values.to][p.shareClass] || 0,
                afterAmount: (amounts[values.to][p.shareClass] || 0) + amount,
                transactionType: 'TRANSFER_TO',
                transactionMethod: 'AMEND'
            });
        }
        else{
            actions.push({
                holders: values.newHolding.persons,
                shareClass: shareClass,
                amount: amount,
                beforeAmount: 0,
                afterAmount: amount,
                transactionType: 'TRANSFER_TO',
                transactionMethod: 'AMEND'
            });
        }
    });
    if(values.newHolding){
        results.push({
            effectiveDate: values.effectiveDate,
            transactionType: 'TRANSFER',
            actions: [newHoldingFormatAction(values.newHolding)]
        });
    }
    results.push({
        effectiveDate: values.effectiveDate,
        transactionType: 'TRANSFER',
        actions: actions
    })

    return results;
}

export const TransferConnected = reduxForm({
  form: 'transfer',
  fields,
  validate,
  destroyOnUnmount: false
})(Transfer);


@connect(undefined)
export class TransferModal extends React.Component {
    constructor(props) {
        super(props);
        this.submit = ::this.submit;
        this.handleClose = ::this.handleClose;
        this.handleNext = ::this.handleNext;
    }

    handleNext() {
        this.refs.form.submit();
    }

    handleClose(data={}) {
        this.props.dispatch(destroy('transfer'));
        this.props.end(data);
    }

    submit(values) {
        const transactions = transferFormatSubmit(values, this.props.modalData.companyState)
        if(transactions.length){
            this.props.dispatch(companyTransaction(
                                    'compound',
                                    this.props.modalData.companyId,
                                    {transactions: transactions, documents: values.documents} ))

            .then(() => {
                this.handleClose({reload: true});
                this.props.dispatch(addNotification({message: 'Shares Transfered'}));
                const key = this.props.modalData.companyId;
            })
            .catch((err) => {
                this.props.dispatch(addNotification({message: err.message, error: true}));
            })
        }
        else{
            this.handleClose();
        }
    }

    renderBody(companyState) {
        const holdingOptions = companyState.holdingList.holdings.map((h, i) => {
            return <option key={i} value={h.holdingId}>{h.name && h.name+': ' } { joinAnd(h.holders, {prop: 'name'}) }</option>
        });
        const shareOptions = ((companyState.shareClasses || {}).shareClasses || []).map((s, i) => {
            return <option key={i} value={s.id}>{s.name}</option>
        });
        const holdingMap = createHoldingMap(companyState);

        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <TransferConnected ref="form"
                    initialValues={{parcels: [{}], effectiveDate: new Date() }}
                    holdingOptions={holdingOptions}
                    holdingMap={holdingMap}
                    shareOptions={shareOptions}
                    showModal={(key) => this.props.dispatch(showModal(key, {
                        ...this.props.modalData,
                        formName: 'transfer',
                        field: 'newHolding',
                        afterClose: { // open this modal again
                            showModal: {key: 'transfer', data: {...this.props.modalData}}
                        }
                    }))}
                    onSubmit={this.submit}/>
                </div>
            </div>
    }

    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Transfer Shares</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                { this.renderBody(this.props.modalData.companyState) }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.handleClose} >Close</Button>
                 <Button onClick={this.handleNext} bsStyle="primary">{ 'Submit' }</Button>
              </Modal.Footer>
            </Modal>
    }

}