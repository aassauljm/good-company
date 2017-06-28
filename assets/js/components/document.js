"use strict";
import React from 'react';
import {requestResource, updateResource, updateMenu, addNotification } from '../actions';
import { pureRender, objectValues, stringDateToFormattedString, requireFields, formFieldProps } from '../utils';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { Link } from 'react-router';
import { fieldStyle } from '../utils';
import AutoAffix from 'react-overlays/lib/AutoAffix'
import Button from 'react-bootstrap/lib/Button'
import Input from './forms/input';
import Widget from './widget';
import PDF from 'react-pdf-component/lib/react-pdf';

@formFieldProps()
class RenameForm extends React.Component {
    render() {
        return <form className="form">
                <Input type="text" {...this.formFieldProps('filename')} label="New Filename" />
        </form>
    }
}

const RenameFormConnected = reduxForm({
    fields: ['filename'],
    form: 'renameDocumentForm',
    validate:  requireFields('filename')
})(RenameForm);



@connect((state, ownProps) => ({
        document: state.resources[`/company/${ownProps.companyId}/document/${ownProps.params.documentId}`] || {data: {}},
        menu: state.menus[`/company/${ownProps.companyId}/document/${ownProps.params.documentId}`] || {}
    }), (dispatch, ownProps) => ({
    fetch: (id, refresh) => dispatch(requestResource(`/company/${ownProps.companyId}/document/${id}`, {refresh})),
    showRename: (id) => dispatch(updateMenu(`/company/${ownProps.companyId}/document/${id}`, {showRename: true})),
    hideRename: (id) => dispatch(updateMenu(`/company/${ownProps.companyId}/document/${id}`, {showRename: false})),
    updateDocument: (id, values) => dispatch(updateResource(`/company/${ownProps.companyId}/document/${id}`, values)),
    addNotification: (...args) => dispatch(addNotification(...args)),
}))
export default class Document extends React.Component {

    constructor() {
        super();
        this.handleSubmit = ::this.handleSubmit;
    }

    key() {
        return this.props.params.documentId
    }

    componentDidMount() {
        this.props.fetch(this.key());
    }

    componentDidUpdate() {
        this.props.fetch(this.key());
    }

    handleSubmit(values) {
        this.props.hideRename(this.key());

        this.props.updateDocument(this.key(), values)
        .catch(e => {
            this.props.fetch(this.key(), true)
            this.props.addNotification({message: e.message, error: true})
        })
    }

    rename(data) {
        return <div>
            <RenameFormConnected ref="form" initialValues={{filename: data.filename}} onSubmit={this.handleSubmit}/>
            <div className="button-row">
                <Button onClick={() => this.props.hideRename(this.key())}>Cancel</Button>
                <Button bsStyle="primary" onClick={() => this.refs.form.submit()}>Save</Button>
            </div>
        </div>
    }

    info(data) {
        return <div>
             <dl>
              <dt>ID</dt>
              <dd>{data.id}</dd>
              <dt>Filename</dt>
              <dd>{data.filename}</dd>
              <dt>Type</dt>
              <dd>{data.type}</dd>
              { data.date && <dt>Date</dt> }
              { data.date && <dd>{ new Date(data.date).toDateString() }</dd> }
              <dt>Date Imported</dt>
              <dd>{stringDateToFormattedString(data.createdAt)}</dd>
              { data.sourceUrl && <dt>Original URL</dt> }
              { data.sourceUrl && <dd><Link target="_blank" to={data.sourceUrl}>Companies Office</Link> </dd> }
            </dl>
          <div className="button-row">
           { !data.sourceUrl && <Link target="_blank" className="btn btn-primary" to={`/api/company/${this.props.companyId}/document/get_document/${this.key()}`}>Download</Link> }
           { this.props.canUpdate && !data.sourceUrl && <Button bsStyle="info" onClick={() => this.props.showRename(this.key())}>Rename</Button> }
            </div>
        </div>
    }

    renderPreview(){
        if(this.props.document.data && this.props.document.data.type === 'application/pdf'){
            return <div className="preview">
                <PDF url={`/api/company/${this.props.companyId}/document/get_document/${this.key()}`} scale={2} />
                </div>
        }
        return <div>
            <h5>Page One Preview</h5>
            <img className="image-loading" src={`/api/company/${this.props.companyId}/document/get_document_preview/${this.key()}`} />
            </div>
    }

    renderDetails(data) {
        return <Widget title="File Details">
                    { this.props.menu.showRename && this.rename(data) }
                    { !this.props.menu.showRename && this.info(data) }
        </Widget>

    }
    render(){
        return <div className="container">
            <div className="row" ref="affixContainer">
                <div className="col-md-12 col-lg-3 col-lg-push-9">
                    { this.props.document.data && <AutoAffix viewportOffsetTop={15} container={() => this.refs.affixContainer}>
                        {  this.renderDetails(this.props.document.data) }
                    </AutoAffix> }
                </div>
                <div className="col-md-12 col-lg-9 col-lg-pull-3">
                   { this.renderPreview() }

                </div>
            </div>
        </div>
    }
}