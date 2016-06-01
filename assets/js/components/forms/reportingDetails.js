import React, {PropTypes} from 'react';
import { Documents } from './documents';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { formFieldProps, requireFields } from '../../utils';
import Input from './input';
import { reduxForm } from 'redux-form';
import TransactionTypes from '../../../../config/enums/transactions';
import STRINGS from '../../strings'

export const standardFieldsDescriptions = {
    'fraReportingMonth': {
    }
}


export const standardFields = ['fraReportingMonth'];
export const defaultCustomFields = ['IRD Number'];

const fields = [
    ...standardFields,
    'reportingFields[].label',
    'reportingFields[].value',
    'documents'

]

const labelClassName = 'col-sm-4';
const wrapperClassName = 'col-sm-8';

@formFieldProps({
    labelClassName: labelClassName,
    wrapperClassName: wrapperClassName ,
})
export class ReportingForm extends React.Component {
    render() {
        const reportingFields = this.props.fields.reportingFields;
        const { handleSubmit, resetForm } = this.props;
        return <form className="form form-horizontal" onSubmit={handleSubmit}>
        <fieldset>
            {standardFields.map((f, i) => {
                return <div className="row" key={i}><Input type="text" {...this.formFieldProps(f)} /></div>
            }) }
            { reportingFields.map((f, i) => {
                return <div className="row" key={i}>
                    <div className="form-group">
                        <div className={labelClassName}>
                            <input type="text" className='form-control text-right' {...f.label} placeholder='Label'/>
                        </div>
                        <div className={wrapperClassName}>
                            <div className="input-group">
                            <input className='form-control' type="text" {...f.value}  />
                            <span className="input-group-btn">
                                { i > 0  && <button type="button" className="btn btn-default" onClick={() => reportingFields.swapFields(i, i - 1) }><Glyphicon glyph="arrow-up" /></button> }
                                { i < reportingFields.length - 1  && <button type="button" className="btn btn-default"onClick={() => reportingFields.swapFields(i, i + 1) }><Glyphicon glyph="arrow-down" /></button> }
                                <button type="button" className="btn btn-default"onClick={() => reportingFields.removeField(i) }><Glyphicon glyph="remove" /></button>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            }) }

            <div className="button-row">
                <button type="button" className="btn btn-default"
                    onClick={() => {
                        this.props.fields.reportingFields.addField({})
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


export const ReportingFormConnected = reduxForm({
    form: 'reportingDetails',
    fields: fields,
  validate
})(ReportingForm);


export function reportingDetailsFormatSubmit(values, companyState){
    const actions = [];
    const transactionMap = {
        'addressForService': TransactionTypes.ADDRESS_CHANGE,
        'registeredCompanyAddress': TransactionTypes.ADDRESS_CHANGE,
        'reportingFields': TransactionTypes.USER_FIELDS_CHANGE
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