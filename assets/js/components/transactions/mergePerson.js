"use strict";
import React from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { personList } from '../../utils';
import { showTransactionView, requestResource } from '../../actions';
import { isNaturalPerson, stringDateToFormattedString, formFieldProps } from '../../utils';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { ShareholderLawLinks } from './updatePerson';
import { AllPersonsHOC } from '../../hoc/resources';
import Input from '../forms/input';
import { Holder } from './selectPerson';
import { reduxForm } from 'redux-form';
import Loading from '../loading';


@reduxForm({
    fields: ['personIds[]'],
    form: 'duplicateSelect'
})
@formFieldProps()
class PersonListx extends React.PureComponent {
    render() {
        return <div> { this.props.persons.filter(p => (p.personId+'') !== this.props.selected).map((p, i) => {
            return <div className="row">
                <div className="col-xs-1">
                        <Input type="checkbox" {...this.formFieldProps(['personIds', i])} />
                </div>
                <div className="col-xs-11">
                    <Holder key={i} person={p}>
                    <dt>Last recorded at</dt>
                    <dd>{ stringDateToFormattedString(p.lastEffectiveDate) }</dd>
                </Holder>
                </div>
                </div>
        }) }
        </div>
    }
}

@reduxForm({
    fields: ['personIds[]'],
    form: 'duplicateSelect'
})
@formFieldProps()
class PersonList extends React.PureComponent {
    render() {
        return <div> { this.props.persons.filter(p => (p.personId+'') !== this.props.selected).map((p, i) => {
            return  <Input type="checkbox" {...this.formFieldProps(['personIds', i])}  label={

                    <Holder key={i} person={p}>
                    <dt>Last recorded at</dt>
                    <dd>{ stringDateToFormattedString(p.lastEffectiveDate) }</dd>
                </Holder>
                } />
        }) }
        </div>
    }
}


@reduxForm({
    fields: ['personSelect'],
    form: 'mergeSelect'
})
@AllPersonsHOC()
@formFieldProps()
class MergePerson extends React.PureComponent {
    render() {
        const persons = this.props[`/company/${this.props.companyId}/all_persons`].data || []
        const loading = this.props[`/company/${this.props.companyId}/all_persons`]._status === 'fetching';
        if(loading){
            return <Loading />
        }
        const options = persons.map((person, i) => {
            return <option key={i} value={person.personId}>{person.name}  (last recorded at { stringDateToFormattedString(person.lastEffectiveDate) }) </option>
        });
        const selected = this.props.fields.personSelect.value;

        return  <div>
            <div className="row">
                    <div className="col-md-6 col-md-offset-3">
                    <Input type="select" {...this.formFieldProps('personSelect')} label={'Please select the person to keep'}>
                    <option value="" disabled>Please Select</option>
                        { options }
                    </Input>
                </div>
            </div>


            { selected && <PersonList persons={persons} selected={selected} initialValues={{ personIds: new Array(persons.length-1).fill(false) }} /> }

        </div>
    }
}



export class MergePersonTransactionView extends React.PureComponent {
    constructor(props) {
        super(props);
        this.handleClose = ::this.handleClose;
    }

    handleClose() {
        this.props.end();
    }

    renderBody() {
        return <div >
            <p>
                Records imported from the Companies Office can contain inaccuracies, resulting in the same person having multiple identities in Good Companies.
                If you notice any duplicated entries in your share register you can merge their identities with this tool.
            </p>
            <p>
                Please note that merging with this tool cannot be undone without reimporting the company.
            </p>
            <MergePerson companyId={this.props.transactionViewData.companyId}/>
        </div>
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'} lawLinks={ShareholderLawLinks()}>
              <TransactionView.Header closeButton>
                <TransactionView.Title>Merge Person</TransactionView.Title>
              </TransactionView.Header>
              <TransactionView.Body>
                {this.renderBody() }
              </TransactionView.Body>
              <TransactionView.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
              </TransactionView.Footer>
            </TransactionView>
    }
}


