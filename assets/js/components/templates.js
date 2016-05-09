"use strict";
import React, {PropTypes} from 'react';
import { showModal } from '../actions';
import { pureRender, numberWithCommas, stringToDate } from '../utils';
import ButtonInput from './forms/buttonInput';
import { Link } from 'react-router';
import STRINGS from '../strings';





@pureRender
export default class Templates extends React.Component {
    static propTypes = {
        companyState: PropTypes.object
    };


    render() {
        const current = this.props.companyState;
        return <div className="container">

            TO DO
        </div>
    }
}




