"use strict";
import React, { PropTypes } from 'react';
import { pureRender } from '../utils';

@pureRender
export default class Forbidden extends React.Component {
    static propTypes = {
        descriptor: PropTypes.string
    };
    render() {
        return <div className="container-fluid page-top">
            <div className="container">
                <div className="alert alert-danger" style={{marginTop: '20px'}}>
                    You are forbidden from accessing this { this.props.descriptor }
                </div>
            </div>
        </div>
    }
}
