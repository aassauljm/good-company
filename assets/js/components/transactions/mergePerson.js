"use strict";
import React from 'react';
import TransactionView from '../forms/transactionView';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { personList } from '../../utils';
import { requestResource, updateResource, addNotification } from '../../actions';
import { isNaturalPerson, stringDateToFormattedString, formFieldProps, requireFields } from '../../utils';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { ShareholderLawLinks } from './updatePerson';
import { AllPersonsHOC } from '../../hoc/resources';
import Input from '../forms/input';
import { Holder } from './selectPerson';
import { reduxForm, reset } from 'redux-form';
import Loading from '../loading';


@reduxForm({
    fields: ['personIds[]'],
    form: 'duplicateSelect',
    validate: values => {
        if(!values.personIds.filter(f => f).length){
            return {_error: ['Select at least one']}
        }
        return {};
    }
})
@formFieldProps()
class PersonList extends React.PureComponent {
    render() {
        const formatSubmit = (values) => {
            this.props.personsSelected({
                source: this.props.persons.find(p => p.personId === this.props.selected),
                targets: values.personIds.reduce((acc, p, i) => {
                if(p){
                    acc.push(this.props.persons[i])
                }
                return acc;
            }, [])});
        }

        return <form onSubmit={this.props.handleSubmit(formatSubmit)}>
            { this.props.persons.map((p, i) => {
            if(p.personId === this.props.selected){
                return false;
            }
            return <div className="row" key={i}>
                <div className="col-xs-2 text-right">
                        <Input type="checkbox" standalone={true} {...this.formFieldProps(['personIds', i])} label={null} style={{marginTop: 30}}/>
                </div>
                <div className="col-xs-8">
                    <Holder key={p.personId} person={p} selectPerson={() => this.props.fields.personIds[i].onChange(!this.props.fields.personIds[i].value) }>
                    <dt>Last recorded at</dt>
                    <dd>{ stringDateToFormattedString(p.lastEffectiveDate) }</dd>
                </Holder>
                </div>
            </div>
        }) }
            <div className="button-row">
             <Button  bsStyle="primary" type="submit" disabled={!this.props.valid}>Merge Persons</Button>
             </div>
        </form>
    }
}



@connect(undefined, {
    resetSubForm: () => reset('duplicateSelect')
})
@reduxForm({
    fields: ['personSelect'],
    form: 'mergeSelect',
    validate: requireFields('personSelect')
})
@AllPersonsHOC()
@formFieldProps()
class MergePerson extends React.PureComponent {

    constructor(props) {
        super(props);
        this.personsSelected = ::this.personsSelected
    }

    personsSelected(values) {
        this.props.next(values);
    }

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

        const onChange = (...args) => {
            this.props.fields.personSelect.onChange(...args);
            this.props.resetSubForm();
        }

        return  <div>
            <div className="row">
                    <div className="col-md-8 col-md-offset-2">
                    <Input type="select" {...this.formFieldProps('personSelect')} label={'Please select the person to keep'} onChange={onChange}>
                    <option value="" disabled>Please Select</option>
                        { options }
                    </Input>
                </div>
            </div>
            { selected && <PersonList ref='form' persons={persons} selected={parseInt(selected, 10)}  personsSelected={this.personsSelected} initialValues={{ personIds: new Array(persons.length).fill(false) }} /> }
        </div>
    }
}

@connect(undefined, {
    submit: (url, data) => updateResource(url, data, {
        confirmation: {
            title: 'Confirm Merge of Persons',
            description: 'This will permanantly merge these persons into a single person.',
            resolveMessage: 'Confirm Submission',
            resolveBsStyle: 'danger'
        },
        loadingMessage: 'Submitting Merge Person'
    }),
    addNotification: (...args) => addNotification(...args)
})
class MergePersonSummary extends React.PureComponent {
    constructor(props) {
        super(props);
        this.submit = ::this.submit;
    }

    submit() {
        this.props.submit(`/company/${this.props.companyId}/merge_persons`, {source: this.props.source, targets: this.props.targets})
            .then(() => {
                this.props.addNotification({message: 'Persons merged'});
                this.props.previous();
            })
            .catch(() => {
                this.props.addNotification({message: 'Could not merge persons', error: true})
            })
    }

    render() {
        return <div>
            <p className="text-center"><strong>This person:</strong></p>
            <Holder  person={this.props.source} />
            <p className="text-center"><strong>Will replace the follow person(s):</strong></p>
            { this.props.targets.map((p, i) => {
                return <Holder person={p} key={i} >
                    <dt>Last recorded at</dt>
                    <dd>{ stringDateToFormattedString(p.lastEffectiveDate) }</dd>
                </Holder>
            }) }
            <div className="button-row">
             <Button onClick={this.props.previous}>Back</Button>
             <Button  bsStyle="primary" type="submit" onClick={this.submit}>Merge Persons</Button>
             </div>
        </div>
    }
}

const PAGES = [
    function() {
        return <div >
            <p>
                Please note that merging with this tool cannot be undone without reimporting the company.
            </p>
            <MergePerson companyId={this.props.transactionViewData.companyId} next={this.props.next}/>
        </div>
    },
     function() {
        return <MergePersonSummary {...this.props.transactionViewData} previous={this.props.previous} />
     }

]


export class MergePersonTransactionView extends React.PureComponent {
    constructor(props) {
        super(props);
        this.handleClose = ::this.handleClose;
    }

    handleClose() {
        this.props.end();
    }

    renderBody() {
        return <div>
            <p>
                Records imported from the Companies Office can contain inaccuracies, resulting in the same person having multiple identities in Good Companies.
                If you notice any duplicated entries in your share register you can merge their identities with this tool.
            </p>
            { PAGES[this.props.index].call(this) }
        </div>
    }

    render() {
        return  <TransactionView ref="transactionView" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'} lawLinks={ShareholderLawLinks()} >
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


