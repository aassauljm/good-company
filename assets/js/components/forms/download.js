"use strict";
import React from 'react';
import { Link } from 'react-router';


export default  function Download(props){
    const className = props.static ? "download-control" : "download-control-static";
    return <div className={className}>
        <Link className="btn btn-success" to={props.url} target='_blank'>Download as PDF <i className="fa fa-file-pdf-o" aria-hidden="true"/></Link>
        </div>
}

