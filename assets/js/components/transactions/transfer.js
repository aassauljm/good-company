"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from 'react-bootstrap/lib/ButtonInput';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import Input from '../forms/input';
import DateInput from '../forms/dateInput';
import { formFieldProps, requireFields, joinAnd } from '../../utils';
import { Link } from 'react-router';
import { companyTransaction, addNotification } from '../../actions';
import { routeActions } from 'react-router-redux';
import STRINGS from '../../strings';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';

const fields = ['effectiveDate', 'from', 'to', 'parcels[].shareClass', 'parcels[].amount']


@formFieldProps()
export class Transfer extends React.Component {
    static propTypes = {
        holdingOptions: PropTypes.array.isRequired,
        shareOptions: PropTypes.array.isRequired,
    };

    render() {
        return <form className="form" >
        <fieldset>
            <DateInput {...this.formFieldProps('effectiveDate')} />
            <Input type="select" {...this.formFieldProps('from', STRINGS.transfer)} >
                <option></option>
                { this.props.holdingOptions }
            </Input>

            <Input type="select" {...this.formFieldProps('to', STRINGS.transfer)} >
                <option></option>
                { this.props.holdingOptions }
            </Input>

            { this.props.fields.parcels.map((n, i) => {
                return <div className="row " key={i}>
                <div className="col-full-h">
                    <div className="col-xs-9 left">
                        <Input type="number" {...this.formFieldProps(['parcels', i, 'amount'])} />
                        <Input type="select" {...this.formFieldProps(['parcels', i, 'shareClass'])} >
                        <option></option>
                        { this.props.shareOptions }
                        </Input>
                    </div>
                    <div className="col-xs-3 right">
                    <button className="btn btn-default" onClick={() => {
                        this.props.fields.parcels.removeField(i)
                    }}><Glyphicon glyph='trash'/></button>
                    </div>
                </div>
                </div>
            }) }
            <div className="button-row"><ButtonInput onClick={() => {
                this.props.fields.parcels.addField();    // pushes empty child field onto the end of the array
            }}>Add Parcel</ButtonInput></div>

        </fieldset>
        </form>
    }
}

const validateBase = requireFields('effectiveDate', 'form', 'to');
const validateParcel = requireFields('amount');

const validate = (values, props) => {
    const errors = validateBase(values);
    if(values.from && values.from === values.to){
        errors.to = ['Destination must be different from source.']
    }
    const parcels = [];
    errors.parcels = values.parcels.map((p, i) => {
        let errors = validateParcel(p);
        const sourceParcels = props.holdingMap[values.from];
        if(parcels.indexOf(p.shareClass) >= 0){
            errors.shareClass = (errors.shareClass || []).concat(['Duplicate share class.']);
        }
        parcels.push(p.shareClass);
        console.log(props.holdingMap)
        const matchedParcels = sourceParcels && sourceParcels.filter(sP => {
            if(sP.shareClass === p.shareClass && p.amount > sP.amount){
                errors.amount = (errors.amount || []).concat(['Insufficient shares in source holding.']);
            }
            return sP.shareClass === p.shareClass;
        })
        if(matchedParcels && !matchedParcels.length){
            errors.shareClass = (errors.shareClass || []).concat(['Source does not have any parcels of this share class.']);
        }
        return errors;
    });
    return errors;

}


const TransferConnected = reduxForm({
  form: 'transfer',
  fields,
  validate
})(Transfer);


@connect(undefined)
export class TransferModal extends React.Component {
    constructor(props) {
        super(props);
        this.submit = ::this.submit;
    }

    handleNext() {
        this.refs.form.submit();
    }

    submit(values) {
        /*fields.map(item => {
            if(item === 'effectiveDate'){
                return;
            }
            if(values[item] !== this.props.modalData.companyState[item]){
                actions.push({
                    transactionType: transactionMap[item] || 'DETAILS',
                    [fieldNameMap[item || 'value']]: values[item],
                    [previousFieldNameMap[item || 'previousValue']]: this.props.modalData.companyState[item],
                    field: item
                })
            }
        });

        console.log(actions)
        if(actions.length){
             this.props.dispatch(companyTransaction('update',
                                            this.props.modalData.companyId,
                                {
                                    actions: actions,
                                    effectiveDate: values.effectiveDate,
                                    transactionType: 'DETAILS'
                                }))

            .then(() => {
                this.props.end();
                this.props.dispatch(addNotification({message: 'Updated Company Details'}));
                const key = this.props.modalData.companyId;
                this.props.dispatch(routeActions.push(`/company/view/${key}`))
            })
            .catch((err) => {
                this.props.dispatch(addNotification({message: err.message, error: true}));
            })
        }
        else{
            this.props.end();
        }*/
    }

    renderBody(companyState) {
        const holdingOptions = companyState.holdingList.holdings.map((h, i) => {
                    return <option key={i} value={h.holdingId}>{h.name && h.name+': ' } { joinAnd(h.holders, {prop: 'name'}) }</option>
                });
        const shareOptions = ((companyState.shareClasses || {}).shareClasses || []).map((s, i) => {
            return <option key={i} value={s.id}>{s.name}</option>
        })
        const holdingMap = companyState.holdingList.holdings.reduce((acc, val) => {
            acc[`${val.holdingId}`] = val.parcels.map(p => ({ amount: p.amount, shareClass: p.shareClass ? `${p.shareClass}` : null }));
            return acc;
        }, {});


        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <TransferConnected ref="form"
                    initialValues={{parcels: [{}], effectiveDate: new Date() }}
                    holdingOptions={holdingOptions}
                    holdingMap={holdingMap}
                    shareOptions={shareOptions}
                    onSubmit={this.submit}/>
                </div>
            </div>

    }

    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Tranfer Shares</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                { this.renderBody(this.props.modalData.companyState) }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.props.end} >Close</Button>
                 <Button onClick={::this.handleNext} bsStyle="primary">{ 'Submit' }</Button>
              </Modal.Footer>
            </Modal>
    }

}