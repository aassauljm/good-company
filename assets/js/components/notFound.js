"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import { pureRender } from '../utils';

@pureRender
export default class NotFound extends React.Component {
    static propTypes = {
        descriptor: PropTypes.string
    };
    render() {
        return <div className="">
            <h4 className="text-center">{this.props.descriptor || ''} Not Found</h4>
        </div>
    }
}
