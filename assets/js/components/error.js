"use strict";
import React from 'react';
import STRINGS from '../strings'


export default class ErrorPage extends React.PureComponent {
    render() {
        const type = this.props.type;
        let message;
        if(type && STRINGS.errors[type]){
            message = STRINGS.errors[type];
        }
        else{
            message = STRINGS.errors._;
        }
        return <div className="container">
                <div className="row">
                    <div className="col-xs-12">
                    <div className="alert alert-danger">
                            { message }
                    </div>
                    </div>
            </div>
            </div>
    }
}

