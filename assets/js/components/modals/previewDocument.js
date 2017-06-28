"use strict";
import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import Input from '../forms/input';
import STRINGS from '../../strings';
import { reduxForm } from 'redux-form';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { addNotification , hidePreviewDocument, renderTemplate, showLoading, endLoading } from '../../actions';
import { connect } from 'react-redux';
import PDF from 'react-pdf-component/lib/react-pdf';
import PDFJS from 'pdfjs-dist'
import Loading from '../loading';
import { saveAs } from 'file-saver';
import Raven from 'raven-js';

PDFJS.PDFJS.workerSrc = '/js/pdf.worker.min.js';

@connect(undefined,
{
    hide: () => hidePreviewDocument(),
    addNotification: (data) => addNotification(data),
    renderTemplate: (...args) => renderTemplate(...args),
    showLoading: () => showLoading(),
    endLoading: () => endLoading(),
    addNotification: (...args) => addNotification(...args)
})
export default class PreviewDocument extends React.Component {
    constructor(props) {
        super(props);
        this.close = ::this.close;
        this.downloadDocument = ::this.downloadDocument;
        this.state = {loading: true}
    }

    componentDidMount(values) {
        this.props.renderTemplate({...this.props.renderData, values: {...this.props.renderData.values, fileType: 'pdf'}})
            .then((result) => {
                return result.response.arrayBuffer()
            })
            .then((blob) => {
                this.setState({blob: blob, loading: false})
            })
            .catch(() => {
                this.setState({loading: false, error: true});
            })
    }

    downloadDocument(){
        let filename;
        this.props.showLoading();
        this.props.renderTemplate(this.props.renderData)
            .then((response) => {
                const disposition = response.response.headers.get('Content-Disposition')
                filename = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition)[1].replace(/"/g, '');
                return response.response.blob()
            })
            .then(blob => {
                saveAs(blob, filename);
            })
            .catch((e) => {
                this.props.addNotification({error: true, message: 'Could not generate document.  An error has been submitted to CataLex on your behalf'});
                Raven.captureMessage('Failed to generate document');
            })
            .then(() => {
                this.close();
                this.props.endLoading();
            })
    }

    close() {
        this.props.hide();
    }

    render() {
        return (
            <Modal show={true} bsSize="large" onHide={this.close} className="preview">
                <Modal.Header closeButton>
                    <Modal.Title>Preview Document</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                   { this.state.loading &&  <Loading /> }
                   { this.state.error &&  <div className="alert alert-danger">There was a problem generating a preview for this document. Please try again later</div> }
                   { this.state.blob &&  <PDF data={this.state.blob} scale={2.5} noPDFMsg="Processing Document..."/> }
                </Modal.Body>
                <Modal.Footer>
                    <Button bsStyle='default' onClick={this.close}>Cancel</Button>
                    <Button bsStyle='primary' onClick={this.downloadDocument}>Download</Button>
                </Modal.Footer>
            </Modal>
        );
        return false;
    }

}
