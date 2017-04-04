"use strict";
import React, { PropTypes } from 'react';
import { pureRender } from '../utils';

@pureRender
export default class NotFound extends React.Component {
    static propTypes = {
        descriptor: PropTypes.string
    };
    render() {
        return <div className="container-fluid page-top">
            <h4 className="text-center">{this.props.descriptor || ''} Not Found</h4>
        </div>
    }
}
