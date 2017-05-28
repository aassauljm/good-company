"use strict";
import React from 'react';
import PropTypes from 'prop-types';
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
