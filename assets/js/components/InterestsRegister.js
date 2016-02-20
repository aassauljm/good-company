"use strict";
import React, {PropTypes} from 'react';
import { requestResource } from '../actions';
import { pureRender, numberWithCommas } from '../utils';
import { connect } from 'react-redux';
import {reduxForm, addArrayValue} from 'redux-form';
import { Link } from 'react-router';
import Input from './forms/input';
import ButtonInput from './forms/buttonInput';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import { fieldStyle, fieldHelp, objectValues, validateWithSchema, requireFields } from '../utils';
import DateInput from './forms/dateInput';

export const fields = [
  'parties[].name',
  'date',
  'details',
  'documents[]'
];

const validateFields = requireFields('date', 'details');
const validateParty = requireFields('name');

const validate = (values) => {
    const errors = validateFields(values);
    errors.parties = values.parties.map(p => validateParty(p));
    console.log(errors)
    return errors;
}

class EntryForm extends React.Component {
    static propTypes = {
        addValue: PropTypes.func.isRequired,
        fields: PropTypes.object.isRequired,
        handleSubmit: PropTypes.func.isRequired,
        resetForm: PropTypes.func.isRequired,
        invalid: PropTypes.bool.isRequired,
        submitting: PropTypes.bool.isRequired
    };
    render() {
        const {
            addValue,
            fields,
            handleSubmit,
            resetForm,
            invalid,
            submitting
        } = this.props;
        return <form onSubmit={handleSubmit}>
            <fieldset>
            { fields.parties.map((n, i) => {
                return <Input type="text" key={i} {...n.name} bsStyle={fieldStyle(n.name)} help={fieldHelp(n.name)} label="Name" hasFeedback />
            }) }
            <ButtonInput onClick={() => {
                fields.parties.addField();    // pushes empty child field onto the end of the array
            }}>Add Party</ButtonInput>
             <DateInput {...fields.date} bsStyle={fieldStyle(fields.date)} help={fieldHelp(fields.date)} label="Date" hasFeedback />
                <Input type="textarea" rows="6" {...fields.details} bsStyle={fieldStyle(fields.details)} help={fieldHelp(fields.details)} label="Details" hasFeedback />
            </fieldset>
        </form>
    }
}

const ConnectedForm = reduxForm({
  form: 'interestEntry',
  fields,
  validate
}, state => ({
     initialValues: {parties: [{name: ''}]}
}), {
  addValue: addArrayValue
})(EntryForm);

export class InterestsRegisterCreate extends React.Component {

    render() {
        return  <div className="col-md-6 col-md-offset-3">
                <ConnectedForm />
        </div>
    }
}


@connect((state, ownProps) => {
    return {data: {}, ...state.resources['/company/'+ownProps.params.id +'/interests_register']}
})
export class InterestsRegister extends React.Component {
    renderList() {
        return <div>
        <Link to={this.props.location.pathname +'/create'} className="btn btn-primary">Create New Entry</Link>
        </div>
    }
    fetch() {
        return this.props.dispatch(requestResource('/company/'+this.key()+'/interests_register'))
    };

    key() {
        return this.props.params.id
    };

    componentDidMount() {
        this.fetch();
    };

    componentDidUpdate() {
        this.fetch();
    };
    render() {
        const interestsRegister = (this.props.data || {});
        if(!interestsRegister){
            return <div className="loading"></div>
        }
        return <div>
                    <div className="container">
                        { !this.props.children && this.renderList(interestsRegister) }
                        { this.props.children }
                    </div>
                </div>
    }
}