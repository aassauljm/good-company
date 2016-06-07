"use strict"

import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';



export default class GCModal extends React.Component {

    render() {
        return <Modal {...this.props} bsSize='large' dialogClassName='fullpage'/>
    }
}

GCModal.Body = Modal.Body;
GCModal.Header = Modal.Header;
GCModal.Title = Modal.Title;
GCModal.Footer = Modal.Footer;
