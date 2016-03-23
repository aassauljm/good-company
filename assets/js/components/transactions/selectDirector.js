"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import ButtonInput from 'react-bootstrap/lib/ButtonInput';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { formFieldProps, requireFields, joinAnd, personList } from '../../utils';
import { showModal } from '../../actions';
import STRINGS from '../../strings';
import { Director } from '../companyDetails';

@connect(undefined)
export class SelectDirectorModal extends React.Component {
    constructor(props) {
        super(props);
        this.handleClose = ::this.handleClose;
    }

    handleClose(data={}) {
        this.props.end(data);
    }

    renderBody() {
        const directors = this.props.modalData.companyState.directorList.directors;
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                { directors.map((p, i) => {
                    return <Director director={p} editDirector={() => this.props.dispatch(showModal('updateDirector', {...this.props.modalData, director: p}))}/>
                    }) }
            <div className="button-row"><ButtonInput onClick={(e) => {
                    this.props.dispatch(showModal('updateDirector', {...this.props.modalData, director: null}))
                }}>Add Director</ButtonInput></div>
            </div>
            </div>
    }

    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Select Director</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                { this.renderBody() }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
              </Modal.Footer>
            </Modal>
    }

}