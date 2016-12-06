"use strict";
import React from 'react';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Fade from 'react-bootstrap/lib/Fade';
import Modal from 'react-overlays/lib/Modal';


export default function Loading(props) {
    return <div className="loading">
            <span className="fa fa-refresh spin" />
        </div>;
}

export function LoadingOverlay(props) {
    let animationTime = props.animationTime;
    if(props.animationTime === undefined){
        animationTime = 300;
    }
    return <Modal show={true} backdrop={true} backdropTransitionTimeout={animationTime} dialogTransitionTimeout={animationTime} className="basic-modal" backdropClassName="modal-backdrop" transition={animationTime ? Fade : null} keyboard={false}>
        <div className="loading-modal" >
        <div className="message">{props.message || 'Loading'}</div>
            <Loading />
          </div>
    </Modal>}