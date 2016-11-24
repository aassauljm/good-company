import React from 'react';
import Input from './input'
import DateTimePicker from 'react-widgets/lib/DateTimePicker'
import moment from 'moment';
import momentLocalizer from 'react-widgets/lib/localizers/moment'

momentLocalizer(moment);

export default class DateInput extends React.Component {

    render() {
        const format = this.props.displayFormat || "DD/MM/YYYY";
        const readFormats = [format];//, "D M YYYY", "D MMM YYYY", "D/M/YYYY", "D-M-YYYY", "D MMMM YYYY"];
        if (this.props.format) {
            readFormats.unshift(this.props.format);
        }

        return (
            <Input {...this.props} groupClassName='has-group'>
                <DateTimePicker
                    onChange={(date, string) =>  {console.log(string); console.log(this.onChange); this.props.format ? this.props.onChange(string) : this.props.onChange(date)}}
                    onSelect={this.props.onSelect}
                    onClick={(e) => { e.preventDefault(); }}
                    calendar={this.props.calendar != false /* False if specifically false. True if true or null */}
                    time={!!this.props.time}
                    value={this.props.value ? new Date(this.props.value) : null}
                    onToggle={(open) => {
                        if (!open) {
                            this.props.onBlur(this.props.value)
                        }
                    }}
                    parse={(string) => {
                        console.log(parse);
                        const mo = moment(string, readFormats);
                        return mo.isValid() ? mo.toDate() : null;
                        }
                    }
                    onBlur={() => {
                        this.props.onBlur(this.props.value)
                    }}
                    format={this.props.format || format} />
            </Input>
        );
    }
}
