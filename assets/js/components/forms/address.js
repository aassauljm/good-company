"use strict";
import React from 'react';
import Input from './input';

export default class Address extends React.Component {
    render() {
        return <Input type="text" {...this.props}/>
    }
}
