"use strict";
import React from 'react';
import { pureRender } from '../utils';
import AuthenticatedComponent from  './authenticated';

@AuthenticatedComponent
@pureRender
export default class NotFound extends React.Component {

    render() {
        return  <div>Not Found</div>
    }
}

