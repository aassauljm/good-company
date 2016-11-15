"use strict";
import React, {PropTypes} from 'react';
import Button from 'react-bootstrap/lib/Button';
import { connect } from 'react-redux';
import { requestWorkingDayOffset } from '../../actions';
import STRINGS from '../../strings';
import Input from '../forms/input';
import moment from 'moment';
import { saveAs } from 'file-saver';


function createICS(data){
    const {title, description, location, url} = data;
    const dtstamp = moment().utc().format('YYYYMMDDTHHmmss') + 'Z';
    const dtstart = moment(data.date).hour(data.hour).utc().format('YYYYMMDDTHHmmss') + 'Z';
    const result = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Good Companies//gc.catalex.nz//Catalex Ltd
METHOD:PUBLISH
BEGIN:VEVENT
DTSTAMP:${dtstamp}
DTSTART;TZID="Auckland, Wellington":${dtstart}
DTEND;TZID="Auckland, Wellington":${dtstart}
SUMMARY:${title}
DESCRIPTION:${description || ''}
LOCATION:${location || ''}
URL:${url || ''}
ORGANIZER:MAILTO:mail@catalex.nz
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:REMINDER
TRIGGER;RELATED=START:-PT24H00M00S
END:VALARM
TRANSP:TRANSPARENT
END:VEVENT
END:VCALENDAR`
    return result;
}


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

    export() {
        const data = {date: this.props.field.value, hour: 11, ...this.props.export()};
        const text = createICS(data)
        const file = new Blob([text], {type: 'text/plain'});
        saveAs(file, `${data.title}.ics`);
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