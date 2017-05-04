"use strict";
import React from 'react';
import { Link } from 'react-router';


export const NavWidget = (props) => {
    return <div className={"widget " + (props.className ? props.className : '')}>
             <Link to={props.link} >
            <span className="widget-header">
                <span className="widget-title">
                    <i className={props.iconClass ? props.iconClass : ''}/> { props.title }
                </span>
                <span className="widget-control">
                    View All
                </span>
            </span>
                </Link>
            <div className={"widget-body " + (props.bodyClass ? props.bodyClass : '')}>
               { props.children }
            </div>
        </div>
}


const Widget = (props) => {
    if(props.link){
        return <NavWidget {...props} />
    }
    return <div className={"widget " + (props.className ? props.className : '')}>
            <div className="widget-header">
                <div className="widget-title">
                    <i className={props.iconClass ? props.iconClass : ''}/> { props.title }
                </div>
            </div>
            <div className={"widget-body " + (props.bodyClass ? props.bodyClass : '')}>
               { props.children }
            </div>
        </div>
}

export default Widget;