"use strict";
import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import {nextCreateCompany, endCreateCompany} from '../actions';
import {reduxForm} from 'redux-form';
import Input from './forms/input';



export class CreateCompany extends React.Component {

    render() {
        const { fields: {companyName, nzbn} } = this.props;

        return  <Modal show={true} bsSize="large" onHide={this.props.end}>

              <Modal.Header closeButton>
                <Modal.Title>Create a new Company</Modal.Title>
              </Modal.Header>

              <Modal.Body>
                    <div >
                    <form className="form-horizontal">
                      <fieldset>
                        <legend>Basic Info</legend>

                            <Input type="text" ref="companyName" {...companyName} label="Company Name" labelClassName="col-xs-2" wrapperClassName="col-xs-10" />
                            <Input type="text" ref="nzbn" {...nzbn} label="NZBN" labelClassName="col-xs-2" wrapperClassName="col-xs-10"/>

                        </fieldset>

                    </form>
                    </div>
              </Modal.Body>

              <Modal.Footer>
                <Button onClick={this.props.end} >Close</Button>
                <Button onClick={this.props.next} bsStyle="primary">Next</Button>
              </Modal.Footer>


            </Modal>
    }
}

export const DecoratedCreateCompany  = reduxForm({
  form: 'createCompany',
  fields: ['companyName', 'nzbn']
})(CreateCompany)


@connect(state => state.modals)
export default class Modals extends React.Component {

    render() {
        if(!this.props.showing){
            return false;
        }
        if(this.props.showing === 'createCompany'){
            return <DecoratedCreateCompany index={this.props.createCompany.index}
                next={() => {this.props.dispatch(nextCreateCompany())} }
                end={() => {this.props.dispatch(endCreateCompany())} }
            />
        }
    }



}