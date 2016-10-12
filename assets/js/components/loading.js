"use strict";
import React from 'react';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';

export default function Loading(props){
    return <div className="loading">
            <Glyphicon glyph="refresh" className="spin" />
        </div>;
}