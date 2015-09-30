"use strict";
import React from 'react';
import { pureRender } from '../utils';
import AuthenticatedComponent from  './authenticated';

@AuthenticatedComponent
@pureRender
export default class Landing extends React.Component{

    render() {
        return  <div >Landing</div>
    }
}

