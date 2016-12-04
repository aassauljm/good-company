import React, {PropTypes} from 'react';
import { Documents } from './documents';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { formFieldProps, requireFields } from '../../utils';
import Input, { getValidInputProps } from './input';
import { reduxForm } from 'redux-form';
import { enums as TransactionTypes } from '../../../../config/enums/transactions';

export const immutableFields = ['registeredCompanyAddress', 'addressForService'];
export const defaultCustomFields = ['Place of Records (if not Registered Office)', 'Head Office', 'Website URL', 'Email', 'Phone', 'Fax'];

const fields = [
...immutableFields,
    'contactFields[].label',
    'contactFields[].value',
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
        const contactFields = this.props.fields.contactFields;
        const { handleSubmit, resetForm } = this.props;
        return <form className="form form-horizontal" onSubmit={handleSubmit}>
        <fieldset>
            {immutableFields.map((f, i) => {
                return <div key={i}><Input type="static" {...this.formFieldProps(f)} onClick={() => this.props.handleClickImmutable(f)}/></div>
            }) }
            { contactFields.map((f, i) => {
                return <div className="form-group" key={i}>
                        <div className={labelClassName}>
                            <input type="text" className='form-control text-right' {...getValidInputProps(f.label)} placeholder='Label'/>
                        </div>
                        <div className={wrapperClassName}>
                            <div className="input-group">
                            <input className='form-control' type="text" {...getValidInputProps(f.value)}  />
                            <span className="input-group-btn">
                                { i > 0  && <button type="button" className="btn btn-default" onClick={() => contactFields.swapFields(i, i - 1) }><Glyphicon glyph="arrow-up" /></button> }
                                { i < contactFields.length - 1  && <button type="button" className="btn btn-default"onClick={() => contactFields.swapFields(i, i + 1) }><Glyphicon glyph="arrow-down" /></button> }
                                <button type="button" className="btn btn-default"onClick={() => contactFields.removeField(i) }><Glyphicon glyph="remove" /></button>
                                </span>
                            </div>
                        </div>

                </div>
            }) }

            <div className="button-row">
                <button type="button" className="btn btn-default"
                    onClick={() => {
                        this.props.fields.contactFields.addField({})
                    }}
                >Add Contact</button>
            </div>
            <Documents documents={this.props.fields.documents}/>
            { this.props.controls && <div className="button-row">
                { this.props.cancel && <button type="button" className="btn btn-default"
                    onClick={this.props.cancel}>Cancel</button> }
                <button type="button" className="btn btn-default"
                    onClick={resetForm}>Reset</button>
                <button type="submit" className="btn btn-primary"
                    >Save Changes</button>
            </div> }
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
        'contactFields': TransactionTypes.USER_FIELDS_CHANGE
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
        if(['effectiveDate', 'noticeDate', 'documents'].indexOf(item) >= 0){
            return;
        }
        if(JSON.stringify(values[item]) !== JSON.stringify(companyState[item])){
            actions.push({
                transactionType: transactionMap[item],
                [fieldNameMap[item] || 'value']: values[item],
                [previousFieldNameMap[item] || 'previousValue']: companyState[item],
                field: item,
                effectiveDate: values.effectiveDate,
                noticeDate: values.noticeDate
            })
        }
    });
    return [{
        actions: actions,
        effectiveDate: (actions[0] || {}).effectiveDate,
        transactionType: TransactionTypes.DETAILS
    }]
}