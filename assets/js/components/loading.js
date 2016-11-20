"use strict";
import React from 'react';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Fade from 'react-bootstrap/lib/Fade';
import Modal from 'react-overlays/lib/Modal';


export default function Loading(props) {
    return <div className="loading">
            <Glyphicon glyph="refresh" className="spin" />
        </div>;
}

export function LoadingOverlay(props) {
    return <Modal show={true} backdrop={true} backdropTransitionTimeout={300} dialogTransitionTimeout={300} className="basic-modal" backdropClassName="modal-backdrop" transition={Fade} keyboard={false}>
        <div className="loading-modal" >
        <div className="message">{props.message || 'Loading'}</div>
            <Loading />
          </div>
    </Modal>}