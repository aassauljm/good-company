"use strict";
import React, {PropTypes} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import Input from './forms/input';
import STRINGS from '../strings'
import { numberWithCommas } from '../utils';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { Link } from 'react-router';

export class TransactionView extends React.Component {
    static propTypes = {
        transaction: PropTypes.object.isRequired,
    };

    renderTransaction(transaction) {
        return <div>

            { transaction.documents && transaction.documents.map((d, i) => {
                return <div key={i}><Link to={`/document/view/${d.id}`} onClick={this.props.end}>{ d.filename }</Link></div>
            }) }
            <pre>{JSON.stringify(transaction, null, 4)}</pre>
        </div>
    };

    render() {
        return <div>{ this.renderTransaction(this.props.transaction) }</div>
    }
};


export class TransactionViewModal extends React.Component {

    static propTypes = {
        modalData: PropTypes.object.isRequired,
    };

    componentWillUnmount() {
        this.refs.modal._onHide();
    }


    render() {
        return  <Modal ref="modal" show={true} bsSize="large" onHide={this.props.end} backdrop={'static'}>
              <Modal.Header closeButton>
                <Modal.Title>{ STRINGS.transactionTypes[this.props.modalData.type] }</Modal.Title>
              </Modal.Header>

              <Modal.Body>
                    <TransactionView transaction={this.props.modalData} end={this.props.end} />
              </Modal.Body>

              <Modal.Footer>
                <Button onClick={this.props.end} >Close</Button>
              </Modal.Footer>
            </Modal>
    }

}

