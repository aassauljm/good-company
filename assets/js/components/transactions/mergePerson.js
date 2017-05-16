"use strict";
import React from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { personList } from '../../utils';
import { showTransactionView, requestResource } from '../../actions';
import { isNaturalPerson, stringDateToFormattedString } from '../../utils';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { ShareholderLawLinks } from './updatePerson';
import { AllPersonsHOC } from '../../hoc/resources';
import Input from '../forms/input';

@AllPersonsHOC()
class MergePerson extends React.PureComponent {
    render() {
        const persons = this.props[`/company/${this.props.companyId}/all_persons`].data || []
        const options = persons.map((person, i) => {
            return <option key={i} value={person.personId}>{person.name}  (last recorded at { stringDateToFormattedString(person.lastEffectiveDate) }) </option>
        })
         return  <div className="row">
                    <div className="col-md-6 col-md-offset-3">
                    <Input type="select" label={'Please select the person to keep'}>
                        { options }
                    </Input>
                </div>
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


