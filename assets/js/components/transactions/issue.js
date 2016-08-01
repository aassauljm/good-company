"use strict";
import React, {PropTypes} from 'react';
import Modal from '../forms/modal';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from '../forms/buttonInput';
import { connect } from 'react-redux';
import { reduxForm, destroy } from 'redux-form';
import Input from '../forms/input';
import DateInput from '../forms/dateInput';
import { formFieldProps, requireFields, joinAnd, renderShareClass, generateShareClassMap } from '../../utils';
import { Link } from 'react-router';
import { companyTransaction, addNotification, showModal } from '../../actions';
import STRINGS from '../../strings';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { ParcelWithRemove } from '../forms/parcel';
import { HoldingWithRemove, newHoldingFormatAction } from '../forms/holding';
import { Documents } from '../forms/documents';




const fields = [
    'effectiveDate',
    'parcels[].amount',
    'parcels[].shareClass',
    'holdings[].newHolding',
    'holdings[].holding',
    'holdings[].parcels[].amount',
    'holdings[].parcels[].shareClass',
    'documents'
];

const validate = (data, props) => {
    const remainder = {};
    data.parcels.map(p => {
        remainder[p.shareClass || undefined] = (remainder[p.shareClass || undefined] || 0) + (parseInt(p.amount, 10) || 0);
    });
    data.holdings.map(h => {
        h.parcels.map(p => {
             remainder[p.shareClass || undefined] = (remainder[p.shareClass || undefined] || 0) - (parseInt(p.amount, 10) || 0);
        })
    });
    const formErrors = {};
    if(Object.values(remainder).some(e => e)){
        formErrors.remainder = remainder;
    }
    if(!data.parcels.length){
        formErrors.parcels = ['Required.'];
    }

    const classes = {}, holdingIds = {};
    return { ...requireFields('effectiveDate')(data),
        parcels: data.parcels.map(p => {
            const errors = requireFields('amount')(p);
            const amount = parseInt(p.amount, 10);

            const shareClass = parseInt(p.shareClass, 10) || '';
            if(!amount){
                errors.amount = ['Required.'];
            }
            else if(amount <= 0){
                errors.amount = ['Must be greater than 0.'];
            }
            if(classes[shareClass]){
                errors.shareClass = ['Duplicate share class.'];
            }
            classes[shareClass] = true;
            return errors;
        }),
        holdings: data.holdings.map(h => {
            const classes = {};
            const errors = requireFields('holding')(h);
            errors.parcels = h.parcels.map(p => {
                const errors = {};
                const shareClass = parseInt(p.shareClass, 10) || '';
                const amount = parseInt(p.amount, 10);
                if(!amount){
                    errors.amount = ['Required.'];
                }
                else if(amount <= 0){
                    errors.amount = ['Must be greater than 0.'];
                }
                if(classes[shareClass]){
                    errors.shareClass = ['Duplicate share class.'];
                }
                classes[shareClass] = true;
                return errors;
            })

            if(!h.newHolding){
                if(!h.holding){
                    errors.holding = ['Required.'];
                }
                if(holdingIds[h.holding]){
                    errors.holding = ['Duplicate holding.'];
                }
                holdingIds[h.holding] = true;
            }
            return errors;
        }), _error: Object.keys(formErrors).length ? formErrors: null };
}


@formFieldProps()
export class Issue extends React.Component {
    static propTypes = {
        holdingOptions: PropTypes.array.isRequired,
        shareOptions: PropTypes.array.isRequired,
        shareClassMap: PropTypes.object.isRequired,
    };

    renderRemaining() {
        if(this.props.error && this.props.error.remainder){
            return Object.keys(this.props.error.remainder).map(r => {
                return this.props.error.remainder[r] && <div key={r}>
                    <div className="alert alert-danger">
                        { this.props.error.remainder[r] > 0 && <span >There are <strong>
                            { this.props.error.remainder[r] }</strong> shares of class { renderShareClass(r, this.props.shareClassMap)} shares left to allocate.</span> }
                        { this.props.error.remainder[r] < 0 && <span >There are <strong>
                            { -this.props.error.remainder[r] }</strong> shares of class { renderShareClass(r, this.props.shareClassMap) } shares over allocated.</span> }
                    </div>
                </div>
            });
        }
    };

    renderParcelErrors() {
        if(this.props.error && this.props.error.parcels){
            return <div className="alert alert-danger">
                        <span>Must include at least one share parcel.</span>
                    </div>
        }
    };

    render() {
        return <form className="form" >
            <DateInput {...this.formFieldProps('effectiveDate')} />
        <fieldset>
            <legend>Issue Parcels</legend>
             { this.props.fields.parcels.map((p, i) => {
                return <div className="row " key={i}>
                    <ParcelWithRemove fields={p} remove={() =>
                        this.props.fields.parcels.removeField(i)} shareOptions={this.props.shareOptions}/>
                </div>
            }) }
            <div className="button-row"><ButtonInput onClick={() => {
                this.props.fields.parcels.addField();
            }}>Add Parcel</ButtonInput></div>
             </fieldset>
            <fieldset>
            <legend>Recipients</legend>
             { this.props.fields.holdings.map((p, i) => {
                return <div className="row " key={i}>
                    <HoldingWithRemove fields={p}
                    remove={() => {
                        this.props.fields.holdings.removeField(i)
                    }}
                    showNewHolding={() => this.props.showNewHolding(i)}
                    shareOptions={this.props.shareOptions}
                    holdingOptions={this.props.holdingOptions}/>
                </div>
            }) }
            <div className="button-row"><ButtonInput onClick={() => {
                this.props.fields.holdings.addField({parcels: [{}]});    // pushes empty child field onto the end of the array
            }}>Add Holding</ButtonInput></div>
            <Documents documents={this.props.fields.documents}/>
            { this.renderRemaining() }

        </fieldset>
        </form>
    }
}


export function issueFormatSubmit(values, companyState){
    const actions = [], results = [], newHoldings = [];
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
            shareClass: shareClass,
            amount: amount,
            transactionType: 'ISSUE_UNALLOCATED',
            effectiveDate: values.effectiveDate
        });
    });
    values.holdings.map(h => {
        h.parcels.map(p => {
            const amount = parseInt(p.amount, 10);
            const shareClass = parseInt(p.shareClass, 10) || null;
            actions.push({
                holdingId: parseInt(h.holding, 10) || null,
                holders: (h.newHolding || {}).persons,
                shareClass: shareClass,
                amount: amount,
                beforeAmount: amounts[h.holding][p.shareClass] || 0,
                afterAmount: (amounts[h.holding][p.shareClass] || 0) + amount,
                transactionType: 'ISSUE_TO',
                transactionMethod: 'AMEND'
            });
            if(h.newHolding){
                newHoldings.push({
                    holders: h.newHolding.persons,
                    effectiveDate: values.effectiveDate,
                    transactionType: 'NEW_ALLOCATION'
                })
            }
        });
    });

    if(newHoldings.length){
        results.push({
            effectiveDate: values.effectiveDate,
            actions: [newHoldingFormatAction(values.newHolding)]
        });
    }
    results.push({
        effectiveDate: values.effectiveDate,
        transactionType: 'ISSUE',
        actions: actions
    })

    return results;
}

const IssueConnected = reduxForm({
  form: 'issue',
  fields,
  validate,
  destroyOnUnmount: false
})(Issue);


@connect(undefined)
export class IssueModal extends React.Component {
    constructor(props) {
        super(props);
        this.submit = ::this.submit;
        this.handleClose = ::this.handleClose;
        this.handleNext = ::this.handleNext;
    }

    handleNext() {
        this.refs.form.submit();
    }

    handleClose(data = {}) {
        this.props.dispatch(destroy('issue'));
        this.props.end(data);
    }

    submit(values) {
        const transactions = issueFormatSubmit(values, this.props.modalData.companyState)
        if(transactions.length){
            this.props.dispatch(companyTransaction(
                                    'compound',
                                    this.props.modalData.companyId,
                                    {transactions: transactions, documents: values.documents} ))

            .then(() => {
                this.handleClose({reload: true});
                this.props.dispatch(addNotification({message: 'Shares Issued'}));
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
                    return <option key={i} value={h.holdingId}>{(h.name ? h.name + ': ' : '') + joinAnd(h.holders, {prop: 'name'}) }</option>
                });
        const shareOptions = ((companyState.shareClasses || {}).shareClasses || []).map((s, i) => {
            return <option key={i} value={s.id}>{s.name}</option>
        })
        const holdingMap = companyState.holdingList.holdings.reduce((acc, val) => {
            acc[`${val.holdingId}`] = val.parcels.map(p => ({ amount: p.amount, shareClass: p.shareClass || undefined }));
            return acc;
        }, {});
        const shareClassMap = generateShareClassMap(companyState);
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <IssueConnected ref="form"
                    initialValues={{parcels: [{}], holdings: [{parcels: [{}]}], effectiveDate: new Date() }}
                    holdingOptions={holdingOptions}
                    holdingMap={holdingMap}
                    shareOptions={shareOptions}
                    showNewHolding={(index) => this.props.dispatch(showModal('newHolding', {
                        ...this.props.modalData,
                        formName: 'issue',
                        field: `holdings[${index}].newHolding`,
                        afterClose: { // open this modal again
                            showModal: {key: 'issue', data: {...this.props.modalData}}
                        }
                    }))}
                    shareClassMap={shareClassMap}
                    onSubmit={this.submit}/>
                </div>
            </div>
    }

    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Issue Shares</Modal.Title>
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