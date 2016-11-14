"use strict";
import React, {PropTypes} from 'react';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { requestWorkingDayOffset } from '../../actions';
import STRINGS from '../../strings';
import Input from '../forms/input';
import moment from 'moment';


@connect(undefined, {
    requestWorkingDayOffset: (options) => requestWorkingDayOffset(options)
})
export default class WorkingDayNotice extends React.Component {

    fetch(source) {
        if(source) {
            this.props.requestWorkingDayOffset({
                scheme: 'companies',
                start_date: moment(source).format('YYYY-MM-DD'),
                amount: this.props.days,
                direction: 'positive',
                inclusion: 0,
                units: 'working_days'
            })
                .then(result => {
                    if(result && result.response){
                        this.props.field.onChange(moment(result.response.result, 'YYYY-MM-DD').toDate())
                    }
                })
        }
    }

    componentWillMount() {
        this.fetch(this.props.source)
    }

    componentWillReceiveProps(newProps) {
        if(newProps.source !== this.props.source){
            this.fetch(newProps.source)
        }
    }

    render() {
        return <Input type="static" value={this.props.field.value ? moment(this.props.field.value).format("DD/MM/YYYY") : ''} label={this.props.label} />
    }
}