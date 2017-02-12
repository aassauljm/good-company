"use strict";
import React from 'react';
import Input from '../forms/input';
import { formFieldProps } from '../../utils';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';




@formFieldProps()
export class ParcelWithRemove extends React.Component {
    render() {
        let className = 'col-xs-12 parcel-row';
        if(this.props.remove){
            className += ' input-group-with-remove';
        }
        if(this.props.add){
            className += ' input-group-with-add';
        }
        if(!this.props.remove && !this.props.add){
            className += ' input-group-pair'
        }
        return <div className={className}>
                    <div>
                        <Input className="amount" type="number" {...this.formFieldProps('amount')} placeholder={'Amount'} label={null} disabled={this.props.allDisabled} />
                    </div>
                    <div >
                        <Input  className="shareClass" type="select" {...this.formFieldProps('shareClass')}  label={null}  disabled={this.props.allDisabled}>
                            {!this.props.forceShareClass && <option value='undefined' className="default">No Share Class</option> }
                            { this.props.shareOptions }
                        </Input>
                    </div>
                    { this.props.remove && <div className="remove-button">
                        <button className="btn btn-default remove-parcel"  disabled={this.props.allDisabled} onClick={(e) => {
                            e.preventDefault();
                            this.props.remove()
                        }}><Glyphicon glyph='trash'/></button>
                    </div> }
                    { this.props.add && <div className="add-button">
                        <button className="btn btn-default add-parcel"  disabled={this.props.allDisabled} onClick={(e) => {
                            e.preventDefault();
                            this.props.add()
                        }}><Glyphicon glyph='plus'/></button>
                    </div> }

            </div>
        }
}
