"use strict";
import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { personList } from '../../utils';
import { showModal } from '../../actions';


@connect(undefined)
export class SelectPersonModal extends React.Component {
    constructor(props) {
        super(props);
        this.handleClose = ::this.handleClose;
    }

    handleClose() {
        this.props.end();
    }

    renderBody() {
        const persons = personList(this.props.modalData.companyState)
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
            { persons.map((p, i) => {
                return <div className="holding well actionable" key={i} onClick={() => this.props.dispatch(showModal('updatePerson', {...this.props.modalData, person: p})) }>
                            <dl className="dl-horizontal">
                                <dt>Name</dt>
                                <dd>{ p.name}</dd>
                                <dt>Address</dt>
                                <dd><span className="address">{ p.address}</span></dd>
                            </dl>
                        </div>
                }) }
            </div>
            </div>
    }


    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.handleClose} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>Select Shareholder</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {this.renderBody() }
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.handleClose}>Cancel</Button>
              </Modal.Footer>
            </Modal>
    }

}