import React from 'react';
import Input from './input'
import Calendar from 'react-widgets/lib/Calendar'
import moment from 'moment';
import momentLocalizer from 'react-widgets/lib/localizers/moment'

momentLocalizer(moment);

export default class DateInput extends React.Component {

    render() {
         return <Calendar {...this.props} />
    }
}