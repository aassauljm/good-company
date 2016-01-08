import React from 'react';
import Input from './input'
import DateTimePicker from 'react-widgets/lib/DateTimePicker'
import moment from 'moment';
import momentLocalizer from 'react-widgets/lib/localizers/moment'

momentLocalizer(moment);

export default class DateInput extends React.Component {

    render() {
        const format="DD/MM/YYYY";
         return <Input {...this.props} >

            <DateTimePicker {...this.props}
            time={false}
            value={this.props.value ? new Date(this.props.value): null }
            onToggle={(open) => {
                if(!open){
                    this.props.onBlur(this.props.value)
                }
            }}
            onBlur={() => {
                this.props.onBlur(this.props.value)
            }}
            format={format} />

          </Input>
    }
}