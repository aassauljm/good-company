"use strict";
import React, {PropTypes} from 'react';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { requestWorkingDayOffset } from '../../actions';
import STRINGS from '../../strings';
import Input from '../forms/input';
import moment from 'moment';
import exportICS from '../ics';

const END_OF_WORKING_DAY_HOUR = 17;

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
                        this.props.field.onChange(moment(result.response.result, 'YYYY-MM-DD').hour(END_OF_WORKING_DAY_HOUR).toDate())
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

    export() {
        const data = {date: this.props.field.value, hour: 11, ...this.props.export()};
        exportICS({...data, title: `${data.title}.ics`});
    }

    render() {
        const props = {
            value: this.props.field.value ? moment(this.props.field.value).format("DD/MM/YYYY") : '',
            label: this.props.label
        }

        if(this.props.export){
            props.buttonAfter = (<Button onClick={() => this.export()}><span className="rw-i rw-i-calendar"/> Export Event</Button>)
        }
        return <Input type="static" {...props} />

    }
}