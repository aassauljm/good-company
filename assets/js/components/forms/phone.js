"use strict";
import React from 'react';
import Input from './input';
import { formFieldProps } from '../../utils';


@formFieldProps()
export default class NameFull extends React.Component {
    render() {
        return <div>
            <Input type="text" {...this.formFieldProps('firstName')} placeholder={'First Name'} label={null} />
            <Input type="text" {...this.formFieldProps('middleNames')} placeholder={'Middle Names'} label={null} />
            <Input type="text" {...this.formFieldProps('lastName')} placeholder={'Last Name'} label={null} />
        </div>
    }
}
