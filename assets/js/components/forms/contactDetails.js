import React, {PropTypes} from 'react';
import { Documents } from './documents';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { formFieldProps, requireFields } from '../../utils';
import Input from './input';
import { reduxForm } from 'redux-form';
import TransactionTypes from '../../../../config/enums/transactions';

export const standardFields = ['registeredCompanyAddress', 'addressForService'];
export const defaultCustomFields = ['Address for Inspection of Records', 'Head Office', 'Branch Offices', 'Website URL', 'Email', 'Phone', 'Fax', 'Lawyers', 'Accountants', 'Bank'];

const fields = [
    ...standardFields,
    'userFields[].label',
    'userFields[].value',
    'documents'

]

const labelClassName = 'col-sm-4';
const wrapperClassName = 'col-sm-8';

@formFieldProps({
    labelClassName: labelClassName,
    wrapperClassName: wrapperClassName ,
})
export class ContactForm extends React.Component {
    render() {
        const userFields = this.props.fields.userFields;
        const { handleSubmit, resetForm } = this.props;
        return <form className="form form-horizontal" onSubmit={handleSubmit}>
        <fieldset>
            {standardFields.map((f, i) => {
                return <div className="row" key={i}><Input type="text" {...this.formFieldProps(f)} /></div>
            }) }
            { userFields.map((f, i) => {
                return <div className="row" key={i}>
                    <div className="form-group">
                        <div className={labelClassName}>
                            <input type="text" className='form-control text-right' {...f.label} placeholder='Label'/>
                        </div>
                        <div className={wrapperClassName}>
                            <div className="input-group">
                            <input className='form-control' type="text" {...f.value}  />
                            <span className="input-group-btn">
                                { i > 0  && <button type="button" className="btn btn-default" onClick={() => userFields.swapFields(i, i - 1) }><Glyphicon glyph="arrow-up" /></button> }
                                { i < userFields.length - 1  && <button type="button" className="btn btn-default"onClick={() => userFields.swapFields(i, i + 1) }><Glyphicon glyph="arrow-down" /></button> }
                                <button type="button" className="btn btn-default"onClick={() => userFields.removeField(i) }><Glyphicon glyph="remove" /></button>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            }) }

            <div className="button-row">
                <button type="button" className="btn btn-default"
                    onClick={() => {
                        this.props.fields.userFields.addField({})
                    }}
                >Add Field</button>
            </div>
            <Documents documents={this.props.fields.documents}/>
            <div className="button-row">
                <button type="button" className="btn btn-default"
                    onClick={resetForm}>Reset</button>
                <button type="submit" className="btn btn-primary"
                    >Save Changes</button>
            </div>
        </fieldset>
        </form>
    }
}


const validate = requireFields('registeredCompanyAddress', 'addressForService')


export const ContactFormConnected = reduxForm({
    form: 'contactDetails',
    fields: fields,
  validate
})(ContactForm);


export function contactDetailsFormatSubmit(values, companyState){
    const actions = [];
    const transactionMap = {
        'addressForService': TransactionTypes.ADDRESS_CHANGE,
        'registeredCompanyAddress': TransactionTypes.ADDRESS_CHANGE,
        'userFields': TransactionTypes.USER_FIELDS_CHANGE
    };
    const fieldNameMap = {
        'addressForService': 'newAddress',
        'registeredCompanyAddress': 'newAddress',
    };
    const previousFieldNameMap = {
        'addressForService': 'previousAddress',
        'registeredCompanyAddress': 'previousAddress'
    };
    Object.keys(values).map(item => {
        if(JSON.stringify(values[item]) !== JSON.stringify(companyState[item])){
            actions.push({
                transactionType: transactionMap[item],
                [fieldNameMap[item] || 'value']: values[item],
                [previousFieldNameMap[item] || 'previousValue']: companyState[item],
                field: item
            })
        }
    });
    return [{
        actions: actions,
        effectiveDate: new Date(),
        transactionType: TransactionTypes.DETAILS
    }]
}