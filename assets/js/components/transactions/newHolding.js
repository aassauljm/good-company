"use strict";
import React, {PropTypes} from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from '../forms/buttonInput';
import { connect } from 'react-redux';
import { reduxForm, change, destroy  } from 'redux-form';
import Input from '../forms/input';
import Address from '../forms/address';
import PersonName from '../forms/personName';
import { HoldingNoParcelsConnected, reformatPersons } from '../forms/holding';
import { formFieldProps, requireFields, joinAnd, personOptionsFromState } from '../../utils';
import { Link } from 'react-router';
import { companyTransaction, addNotification, showTransactionView } from '../../actions';
import STRINGS from '../../strings';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import StaticField from '../forms/staticField';


@connect(undefined)
export class NewHoldingTransactionView extends React.Component {
    constructor(props) {
        super(props);
        this.submit = ::this.submit;
        this.handleClose = ::this.handleClose;
    }

    handleNext() {
        this.refs.form.submit();
    }

    handleClose() {
        this.props.dispatch(destroy('newHolding'));
        this.props.end();
    }

    submit(values) {
        if(this.props.transactionViewData.afterClose){
            const persons = reformatPersons(values, this.props.transactionViewData.companyState);
            this.props.dispatch(change(this.props.transactionViewData.formName, this.props.transactionViewData.field, {...values, persons: persons}));
            this.handleClose();
            return;
        }
        this.handleClose();
    }

    renderBody(companyState) {
        const personOptions = personOptionsFromState(companyState);
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <HoldingNoParcelsConnected
                    ref="form"
                    form='newHolding'
                    initialValues={{persons: [{}]}}
                    personOptions={personOptions}
                    noEffectiveDate={this.props.transactionViewData.noEffectiveDate}
                    noDocuments={this.props.transactionViewData.noDocuments}
                    showTransactionView={(key, index) => this.props.show(key, {
                        ...this.props.transactionViewData,
                        formName: 'newHolding',
                        field: `persons[${index}].newPerson`,
                        afterClose: { // open this transactionView again
                            showTransactionView: {key: 'newHolding', data: {...this.props.transactionViewData}}
                        }
                    })}
                    onSubmit={this.submit}/>
                </div>
            </div>

    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" animation={!this.props.transactionViewData.afterClose} onHide={this.handleClose} backdrop={'static'}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>New Shareholding</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                { this.renderBody(this.props.transactionViewData.companyState) }
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={this.handleClose} >Cancel</Button>
                 <Button onClick={::this.handleNext} bsStyle="primary">Create</Button>
              </TransactionView.Footer>
            </TransactionView>
    }

}