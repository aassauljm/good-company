"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { importCompany, addNotification, requestResource, createResource, importBulk } from '../actions';
import { reduxForm} from 'redux-form';
import Input from './forms/input';
import STRINGS from '../strings'
import { fieldStyle, fieldHelp, requireFields, formFieldProps } from '../utils';
import { push } from 'react-router-redux'
import LookupCompany from './lookupCompany';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';

const fields = [
    'listType',
    'identifierList'
];

const validate = requireFields('identifierList')

@formFieldProps()
export class BulkImport extends React.Component {
    render() {
        return <form className="form"onSubmit={this.props.handleSubmit} >
            <Input type="select" {...this.formFieldProps('listType', STRINGS.bulkImport)}>
                <option value="nzbn">{STRINGS.bulkImport.nzbn}</option>
                <option value="companyName">{STRINGS.bulkImport.companyName}</option>
                <option value="companyNumber">{STRINGS.bulkImport.companyNumber}</option>
            </Input>
            <Input type="textarea" rows="10" {...this.formFieldProps('identifierList', STRINGS.bulkImport)} label={'List of '+STRINGS.bulkImport[this.props.fields.listType.value]+'s'} />
            <div className="button-row">
                <Button bsStyle="primary" type="submit" onClick={this.props.import}>Import</Button>
            </div>
        </form>
    }
}


const BulkImportConnected = reduxForm({
  form: 'bulkImport',
  fields,
  validate,
  initialValues: {listType: 'nzbn'}
})(BulkImport);


@connect(state => state.importBulk, {
    importBulk: (data) => importBulk(data),
    addNotification: (data) => addNotification(data),
    navigateHome: () => push('/')
})
export class ImportMenu extends React.Component {

    handleSubmit(values) {
        const list = values.identifierList.split('\n').filter(v => v);
        this.props.importBulk({
            listType: values.listType,
            list: list
        })
            .then((result = {response: {message: 'No connection'}}) => {
                this.props.addNotification({message: `${list.length} Compan${list.length > 1 ? 'ies': 'y'} queued for import`});
                this.props.navigateHome();
            })
            .catch(error => {
                this.props.addNotification({message: `Could not import companies, Reason: ${error.message}`, error: true});
            })
    }

    render() {
        const valid = false;
        return <div className="container">
                <div className="row">
                <div className="widget">
                    <div className="widget-header">
                        <div className="widget-title">
                            Bulk Import from the New Zealand Companies Office
                        </div>
                    </div>
                    <div className="widget-body">
                       <div className="row">
                         <div className="col-md-6 col-md-offset-3">
                            <BulkImportConnected onSubmit={::this.handleSubmit}/>
                        </div>
                        </div>
                    </div>
                </div>
                </div>
            </div>
    }

}
const DEFAULT_STATE = {};


const ImportMenuConnected = connect(state => DEFAULT_STATE, {
    import: () => createResource('/company/import_bulk/companiesoffice')
})(ImportMenu);
export default ImportMenuConnected;