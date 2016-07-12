"use strict";
import React from 'react';
import Input from '../forms/input';
import { formFieldProps } from '../../utils';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';




@formFieldProps()
export class ParcelWithRemove extends React.Component {
    render() {
        return <div className="parcel col-xs-12">
                    <div>
                        <Input className="amount" type="number" {...this.formFieldProps('amount')} placeholder={'Amount'} label={null}/>
                    </div>
                    <div >
                        <Input  className="shareClass" type="select" {...this.formFieldProps('shareClass')}  label={null}>
                            <option value='undefined' className="default">No Share Class</option>
                            { this.props.shareOptions }
                        </Input>
                    </div>
                    <div>
                        <button className="btn btn-default remove-parcel" onClick={(e) => {
                            e.preventDefault();
                            this.props.remove()
                        }}><Glyphicon glyph='trash'/></button>
                    </div>
            </div>
        }
}
