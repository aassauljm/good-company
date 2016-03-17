"use strict";
import React from 'react';
import Input from '../forms/input';
import ButtonInput from '../forms/buttonInput';
import { formFieldProps, newHoldingString } from '../../utils';
import { ParcelWithRemove } from './parcel';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import STRINGS from '../../strings';
import StaticField from 'react-bootstrap/lib/FormControls/Static';



@formFieldProps()
export class HoldingWithRemove extends React.Component {
    render() {
        return <div className="col-full-h">
                <div className="col-xs-9 left">
                   { !this.props.fields.newHolding.value && <Input type="select" {...this.formFieldProps('holding')} >
                        <option></option>
                        { this.props.holdingOptions }
                    </Input> }

                    { !this.props.fields.newHolding.value &&
                    <div className="button-row"><ButtonInput onClick={this.props.showNewHolding}>Create New Holding</ButtonInput></div> }

                    { this.props.fields.newHolding.value  &&
                        <StaticField type="static"  value={newHoldingString(this.props.fields.newHolding.value)}
                        buttonAfter={<button className="btn btn-default" onClick={(e) => {
                            e.preventDefault();
                            this.props.fields.newHolding.onChange(null);
                        }}><Glyphicon glyph='trash'/></button>} /> }

                    { this.props.fields.parcels.map((p, i) =>
                        <ParcelWithRemove key={i}
                        shareOptions={this.props.shareOptions}
                        fields={p}
                        remove={() => this.props.fields.parcels.removeField(i) } />) }
                    <div className="button-row"><ButtonInput onClick={(e) => {
                        e.preventDefault();
                        this.props.fields.parcels.addField();    // pushes empty child field onto the end of the array
                    }}>Add Parcel</ButtonInput></div>

                </div>
                <div className="col-xs-3 right">
                <button className="btn btn-default" onClick={(e) => {
                    e.preventDefault();
                    this.props.remove()
                }}><Glyphicon glyph='trash'/></button>
                </div>
            </div>
        }
}