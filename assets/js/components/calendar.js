"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux'
import { asyncConnect } from 'redux-connect';
import { requestResource, createResource, resetModals, addNotification } from '../actions';
import { Link } from 'react-router';
import { AlertWarnings } from './companyAlerts';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Button from 'react-bootstrap/lib/Button';
import moment from 'moment';
import Calendar from 'react-widgets/lib/Calendar';
import LawContainer from './lawBrowserContainer';
import DateInput from './forms/dateInput';
import Input from './forms/input';
import { reduxForm } from 'redux-form';
import WorkingDayNotice from './forms/workingDays';
import STRINGS from '../strings';
import { formFieldProps, requireFields, stringToDateTime } from '../utils';
import { OverlayTrigger } from './lawBrowserLink';
import Tooltip from 'react-bootstrap/lib/Tooltip';


const eventMap = (events) => {
    const eventMap = events.reduce((acc, event) => {
        const str = moment(event.date).format('YYYY-MM-DD');
        acc[str] = [...(acc[str] || []), event];
        return acc;
    }, {})
    return {eventList: events, eventMap: eventMap}
}



class Day extends React.Component {
    render() {
        const str = moment(this.props.date).format('YYYY-MM-DD');
        let title = [moment(this.props.date).format("D MMMM YYYY")];
        let classes = [];
        if(this.props.events && this.props.events.data && this.props.events.data.eventMap[str]){
            classes = ['event-day'];

            title = [...title, ...(this.props.events.data.eventMap[str].map(e => (e.data||{}).title))];
        }

       /* if(this.props.holidays[str]){
            title = [...title, ...new Set(Object.keys(this.props.holidays[str]).map(key => STRINGS_FULL[key]))]
            classes = Object.keys(this.props.holidays[str]);
        }*/
        const tooltip = <Tooltip id="tooltip">{ title.map((t, i) => <div key={i}>{t}</div>)}</Tooltip>;
        return  <OverlayTrigger placement="top" overlay={tooltip} hover={true}>
                <div title={title} className={'day ' + classes.join(' ')}>
                   { this.props.label} </div>
        </OverlayTrigger>
    }
}

const DayWithEvents = connect(state => ({events: state.resources['/events']}))(Day);



@connect(state => ({events: state.resources['/events']}), {
    push: (location) => push(location),
    requestEvents: (args) => requestResource('/events', {postProcess:eventMap})
})
export default class CalendarFull extends React.Component {
    componentDidMount() {
        this.props.requestEvents();
    }

    componentDidUpdate() {
        this.props.requestEvents();
    }

    render() {
        return <LawContainer>
            <div className="widget">
                <div className="widget-header">
                    <div className="widget-title">
                    <span className="fa fa-calendar"/> { STRINGS.calendar.calendar }
                   <div className="widget-control">
                    </div>

                    </div>
                </div>

                <div className="widget-body">
                    { this.props.children && React.cloneElement(this.props.children, {
                            close: () => this.props.push('/'+this.props.route.path)
                    })}
                    { !this.props.children &&  <div><Calendar dayComponent={DayWithEvents}  />
                    <div className="button-row">
                        <Link to ="/calendar/create" className="btn btn-info">Create Event</Link>
                    </div>
                    </div> }
                </div>
            </div>
        </LawContainer>
    }
}



const labelClassName = 'col-sm-2';
const wrapperClassName = 'col-sm-8';
@formFieldProps({
    labelClassName,
    wrapperClassName
})
class EventForm extends React.Component {
    render() {
        return <form className="form form-horizontal">
            <DateInput {...this.formFieldProps('date', STRINGS.calendar) } time={true} displayFormat={'DD/MM/YYYY HH:mm:ss'}/>
            <Input type="select" {...this.formFieldProps('companyId', STRINGS.calendar) }>
                { this.props.companyOptions }
            </Input>
            <Input type="text" {...this.formFieldProps('title', STRINGS.calendar) } />
            <Input type="textarea" rows="3" {...this.formFieldProps('description', STRINGS.calendar) } />
            <Input type="text" {...this.formFieldProps('location', STRINGS.calendar) } />
        </form>
    }
}

const EventFormConnected = reduxForm({
    fields: ['date', 'companyId', 'title', 'description', 'location'],
    form: 'newEvent',
    validate: requireFields('date', 'title')
})(EventForm)


@connect(state => ({companies: state.resources[`companies`]}), {
    requestCompanies: () => requestResource(`companies`),
    addNotification: (args) => addNotification(args),
    createEvent: (args) => createResource('/event', args)
})
export  class CreateEvent extends React.Component {
    constructor(props) {
        super(props);
        this.handleSubmit = ::this.handleSubmit;
    }

    handleSubmit(values) {
        const {companyId, date, ...data} = values;
        return this.props.createEvent({companyId, date, data})
            .then(() => {
                this.props.addNotification({message: 'Event Created'});;
                this.props.close();
            })
            .catch((err) => {
                this.props.addNotification({message: err.message, error: true});
            })
    }

    componentDidMount() {
        this.props.requestCompanies();
    }

    componentDidUpdate() {
        this.props.requestCompanies();
    }

    companyOptions() {
        return [
            <option key={-1}></option>,
            ...(((this.props.companies || {}).data || []).map((c, i) =>
                <option value={c.id} key={i}>{c.currentCompanyState.companyName}</option>
        ))];
    }

    render() {
        return <div>
            <EventFormConnected companyOptions={this.companyOptions()} onSubmit={this.handleSubmit} ref='form'/>
                <div className="button-row">
                <Button onClick={this.props.close}>Cancel</Button>
                <Button bsStyle="primary" onClick={() => this.refs.form.submit()}>{ STRINGS.calendar.create}</Button>
            </div>
        </div>
    }
}


@connect(state => ({events: state.resources['/events']}), {
    push: (location) => push(location),
    requestEvents: (args) => requestResource('/events', {postProcess:eventMap})
})
export class CalendarWidget extends React.Component {
    componentDidMount() {
        this.props.requestEvents();
    }

    componentDidUpdate() {
        this.props.requestEvents();
    }

    render() {
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                <span className="fa fa-calendar"/> { STRINGS.calendar.calendar }

                </div>
                 <div className="widget-control">
                 <Link to={`/calendar`} >View All</Link>
                </div>
            </div>

            <div className="widget-body">
                <Calendar dayComponent={DayWithEvents} />
                <div className="button-row">
                    <Link to ="/calendar/create" className="btn btn-info">Create Event</Link>
                </div>
            </div>
        </div>
    }
}