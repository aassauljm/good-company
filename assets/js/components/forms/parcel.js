"use strict";
import React from 'react';
import Input from '../forms/input';
import { formFieldProps } from '../../utils';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';




@formFieldProps()
export class ParcelWithRemove extends React.Component {
    render() {
        return <div className="col-full-h">
                <div className="col-xs-9 left">
                    <Input type="number" {...this.formFieldProps('amount')} placeholder={'Amount'} />
                    <Input type="select" {...this.formFieldProps('shareClass')} >
                        <option value='' className="default">No Share Class</option>
                        { this.props.shareOptions }
                    </Input>
                </div>
                <div className="col-xs-3 right">
                <button className="btn btn-default" onClick={() => {
                    this.props.remove()
                }}><Glyphicon glyph='trash'/></button>
                </div>
            </div>
        }
}