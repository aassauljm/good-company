import React from 'react';
import Input from './input'
import DateTimePicker from 'react-widgets/lib/DateTimePicker'
import moment from 'moment';
import momentLocalizer from 'react-widgets/lib/localizers/moment'

momentLocalizer(moment);

export default class DateInput extends React.Component {

    render() {
        const format="DD/MM/YYYY";
        const readFormats = [format, "D M YYYY", "D MMM YYYY", "D/M/YYYY", "D-M-YYYY", "D MMMM YYYY"]
         return <Input {...this.props} groupClassName='has-group'>

            <DateTimePicker {...this.props}
            time={false}
            value={this.props.value ? new Date(this.props.value): null }
           // onChange={(date, string) => this.props.onChange(string)}
            onToggle={(open) => {
                if(!open){
                    this.props.onBlur(this.props.value)
                }
            }}
            parse={(string) => {
                const mo = moment(string, readFormats)
                return mo.isValid() ? mo.toDate() : null;
                }
            }
            onBlur={() => {
                this.props.onBlur(this.props.value)
            }}
            format={format} />

          </Input>
    }
}