"use strict";
import React from 'react';
import Modal from '../forms/modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { personList } from '../../utils';
import { showModal, requestResource } from '../../actions';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';


@connect(undefined, (dispatch, ownProps) => ({
    selectPerson: (person) => dispatch(showModal('updatePerson', {...ownProps.modalData, person}))
}))
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
                return <div className="holding well actionable" key={i} onClick={() => this.props.selectPerson(p) }>
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



@connect((state, ownProps) => {
    return {
        historicHolders: state.resources['/company/'+ownProps.modalData.companyId +'/historic_holders']
    }
}, (dispatch, ownProps) => ({
    requestData: () => dispatch(requestResource(`/company/${ownProps.modalData.companyId}/historic_holders`)),
    selectPerson: (person) => dispatch(showModal('updateHistoricPerson', {...ownProps.modalData, person}))
    })
)
export class SelectHistoricPersonModal extends React.Component {
    constructor(props) {
        super(props);
        this.handleClose = ::this.handleClose;
    }

    handleClose() {
        this.props.end();
    }

    fetch() {
        return this.props.requestData();
    };

    componentDidMount() {
        this.fetch();
    };

    componentDidUpdate() {
        this.fetch();
    };

    renderBody() {
        const persons = this.props.historicHolders;
        if(!persons || !persons.data){
             return <div className="loading"> <Glyphicon glyph="refresh" className="spin"/></div>
        }
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
            { persons.data.map((p, i) => {
                return <div className="holding well actionable" key={i} onClick={() => this.props.selectPerson(p) }>
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
                <Modal.Title>Select Historic Shareholder</Modal.Title>
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