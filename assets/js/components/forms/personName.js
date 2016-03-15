"use strict";
import React from 'react';
import Input from './input';

// TODO, connect to lookupPerson

export default class PersonName extends React.Component {
    render() {
        return <Input type="text" {...this.props}/>
    }
}
