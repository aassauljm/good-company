import React from 'react';
import Input from './input'
import DateTimePicker from 'react-widgets/lib/DateTimePicker'
import moment from 'moment';
import momentLocalizer from 'react-widgets/lib/localizers/moment'

momentLocalizer(moment);

export default class DateInput extends React.Component {

    render() {
        const format = this.props.displayFormat || "DD/MM/YYYY";
        const readFormats = [format, "D M YYYY", "D MMM YYYY", "D/M/YYYY", "D-M-YYYY", "D MMMM YYYY"];
        if(this.props.format){
            readFormats.unshift(this.props.format);
        }
        let groupName = 'has-group';
        if(this.props.time){
            groupName += ' has-two-controls';
        }
         return <Input {...this.props} groupClassName={groupName}>

            <DateTimePicker
            onChange={(date, string) => this.props.format ? this.props.onChange(string) :  this.props.onChange(date)}
            onSelect={this.props.onSelect}
            disabled={this.props.disabled}
            onClick={(e) => {
                e.preventDefault();
            }}
            time={!!this.props.time}
            value={this.props.value ? new Date(this.props.value): null }
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
                this.props.onBlur && this.props.onBlur(this.props.value)
            }}
            format={this.props.format || format} />
          </Input>
    }
}
