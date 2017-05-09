"use strict";
import React from 'react';
import Input from './input';
import { formFieldProps } from '../../utils';
// TODO, connect to lookupPerson

export default class PersonName extends React.Component {
    render() {
        return <Input type="text" {...this.props}/>
    }
}



@formFieldProps()
export class PersonNameFull extends React.Component {
    render() {
        return <div>
            <Input type="text" {...this.formFieldProps('firstName')} placeholder={'First Name'} label={null} />
            <Input type="text" {...this.formFieldProps('middleNames')} placeholder={'Middle Names'} label={null} />
            <Input type="text" {...this.formFieldProps('lastName')} placeholder={'Last Name'} label={null} />
        </div>
    }
}
