"use strict";
import React from 'react';
import {requestResource, updateResource, updateMenu} from '../actions';
import { pureRender, objectValues, stringDateToFormattedString, requireFields, formFieldProps } from '../utils';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { Link } from 'react-router';
import { fieldStyle } from '../utils';
import AutoAffix from 'react-overlays/lib/AutoAffix'
import Button from 'react-bootstrap/lib/Button'
import Input from './forms/input';

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
        document: state.resources['/document/'+ownProps.params.documentId ] || {data: {}},
        menu: state.menus['document/'+ownProps.params.documentId] || {}
    }), {
    fetch: (id) => requestResource('/document/'+id),
    showRename: (id) => updateMenu('document/'+id, {showRename: true}),
    hideRename: (id) => updateMenu('document/'+id, {showRename: false}),
    updateDocument: (id, values) => updateResource('/document/'+id, values)
})
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
           { !data.sourceUrl && <Link target="_blank" className="btn btn-primary" to={`/api/document/get_document/${this.key()}`}>Download</Link> }
           { !data.sourceUrl && <Button bsStyle="info" onClick={() => this.props.showRename(this.key())}>Rename</Button> }
            </div>
        </div>
    }



    renderDetails(data) {
        return <div className={"widget"}>
                <div className="widget-header">
                    <div className="widget-title">
                        File Details
                    </div>
                </div>
                <div className="widget-body">
                    { this.props.menu.showRename && this.rename(data) }
                    { !this.props.menu.showRename && this.info(data) }
                </div>
        </div>
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
                    <h5>Page One Preview</h5>
                     <img className="image-loading" src={"/api/document/get_document_preview/"+ this.key()} />

                </div>
            </div>
        </div>
    }
}