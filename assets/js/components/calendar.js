"use strict";
import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux'
import { asyncConnect } from 'redux-connect';
import { requestResource, createResource, updateResource, deleteResource, resetTransactionViews, addNotification, updateMenu } from '../actions';
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
import { formFieldProps, requireFields, stringDateToFormattedStringTime } from '../utils';
import { OverlayTrigger } from './lawBrowserLink';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import exportICS from './ics'
import Loading from './loading';
import { requestAlerts } from './alerts';


const DEFAULT_OBJ = {};
const DEFAULT_DEADLINE_HOUR = 11;


const eventMap = (events) => {
    const eventMap = events.reduce((acc, event) => {
        const str = moment(event.date).format('YYYY-MM-DD');
        acc[str] = acc[str] || []
        acc[str].push(event);
        return acc;
    }, {})
    return {eventList: events, eventMap: eventMap}
}



class Day extends React.Component {
    render() {
        const MAX_ENTRIES = 5;
        const str = moment(this.props.date).format('YYYY-MM-DD');
        const dateString = moment(this.props.date).format("D MMMM YYYY");
        let title = [];
        let classes = [];
        let events = false;
        if(this.props.today === str){
            classes.push('today')
        }
        if(this.props.events && this.props.events.data && this.props.events.data.eventMap[str]){
            classes.push('event-day');
            title = [...title, ...(this.props.events.data.eventMap[str].map(e => (e.data||{}).title))];
            events = true;
        }

        if(this.props.alerts && this.props.alerts.data && this.props.alerts.data.dateMap[str]){
            const companyEvents = this.props.alerts.data.dateMap[str];
            companyEvents.map(d => {
                if(d.deadlines){
                    classes.push('deadline-day ');
                    Object.keys(d.deadlines).map(k => {
                        title.push(`${STRINGS.deadlines[k]} due for ${d.companyName}${ d.deadlines[k].overdue ? ' (Overdue)' :''}`)
                    })
                }
                if(d.transaction){
                    classes.push('transaction-day ');
                    const transactionType = d.transaction.subTransactions[0].type;
                    title.push(`${STRINGS.transactionTypes[transactionType]} scheduled for ${d.companyName}`)
                }
            })
            //title = [...title, ...(this.props.events.data.eventMap[str].map(e => (e.data||{}).title))];
            events = true;
        }

        if(this.props.selected === str){
            classes.push('selected')
        }
        const day = <div  className={'day ' + classes.join(' ')}>{ this.props.label} </div>;
        if(events){
            if(title.length > MAX_ENTRIES){
                title = title.slice(0, MAX_ENTRIES);
                title.push('...')
            }
            const tooltip = <Tooltip id="tooltip">
                <div className="tooltip-title">{ dateString }</div>
                <div>{ title.map((t, i) => <div key={i} className="tooltip-entry">{t}</div>)}</div>
            </Tooltip>;
            return  <OverlayTrigger placement="top" overlay={tooltip} hover={true}>
                    { day }
            </OverlayTrigger>
        }
        return day;
    }
}


const DayWithData = (props) => (moreProps) => <Day {...props} {...moreProps} />


const EventSummary = (props) => {
    const {event: {data={}, date, companyId, id}} = props;
    const {title, description, location, reminder} = data || {};
    const company = companyId && props.companies.data && props.companies.data.filter(c => c.id === props.event.companyId)[0];
    let fullTitle = title;
    if(company){
        fullTitle = `${title} - ${company.currentCompanyState.companyName}`;
    }
    const time = moment(date).format("hh:mm:ss a");
    return <div className="summary">
        <div className="title">{ title }</div>
        { company && <div className="company"><Link to={`/company/view/${company.id}`}>{company.currentCompanyState.companyName}</Link></div> }
        <p  className="time">{ time }</p>
        { description &&<p>{ description }</p> }
        { location &&<p>{ location }</p> }

        <div className="controls">
        <Link to={`/calendar/edit/${id}`}>edit</Link>
            <a href="#" onClick={() => props.deleteEvent(id)}>delete</a>
            <a href="#" onClick={() => exportICS({title: fullTitle, date: new Date(date), description, reminder})}>export</a>
        </div>
    </div>
}

const DeadlineAlert = (props) => {

    const title = `${STRINGS.deadlines[props.alert.deadlineType]} due`
    const fullTitle = `${title} for ${props.alert.companyName}`;
    const reminder = '-P1D';
    let description = '';
    const dateMoment = moment(props.date).hour(DEFAULT_DEADLINE_HOUR);
    const time = dateMoment.format("hh:mm:ss a");

    if(props.alert.deadlineType === 'annualReturn'){
        description = `The annual return filing month is ${props.alert.deadline.arFilingMonth}`;
    }
    return <div className="summary">
        <div className="title">{ title }</div>
        <div className="company"><Link to={`/company/view/${props.alert.id}`}>{props.alert.companyName}</Link></div>
        <p  className="time">{ time }</p>
         { description &&<p>{ description }</p> }
        <div className="controls">
            { !props.alert.deadline.overdue &&  <a href="#" onClick={() => exportICS({title: fullTitle, date: dateMoment.toDate(), description, reminder})}>export</a> }
        </div>
    </div>
}

const TransactionAlert = (props) => {
    const title = `${STRINGS.transactionTypes[props.alert.transaction.subTransactions[0].type]} scheduled`
    const fullTitle = `${title} for ${props.alert.companyName}`;
    const reminder = '-P1D';
    let description = '';
    const dateMoment = moment(props.alert.transaction.effectiveDate);
    const time = dateMoment.format("hh:mm:ss a");

    return <div className="summary">
        <div className="title">{ title }</div>
        <div className="company"><Link to={`/company/view/${props.alert.id}`}>{props.alert.companyName}</Link></div>
        <p  className="time">{ time }</p>
         { description &&<p>{ description }</p> }
        <div className="controls">
            { <a href="#" onClick={() => exportICS({title: fullTitle, date: dateMoment.toDate(), description, reminder})}>export</a> }
        </div>
    </div>
}


const AlertSummary = (props) => {
    if(props.alert.deadline){
        return DeadlineAlert(props)
    }
    if(props.alert.transaction){
        return TransactionAlert(props)
    }
}


const EventSummaries = (props) => {
    return <div>
        <h2>{ moment(props.date).format("D MMMM YYYY")}</h2>
            { props.eventList.map((event, i) => <EventSummary key={i} {...props} event={event} /> ) }

            { props.alertList.map((alert, i) => <AlertSummary key={i} {...props} alert={alert} /> ) }

            { !props.eventList.length && !props.alertList.length  &&  <em>{ STRINGS.calendar.noEvents }</em>}
        </div>
}



const CalendarHOC = ComposedComponent => {

    class Calendar extends React.Component {
        fetch(){
            this.props.requestEvents();
            this.props.requestCompanies();
            this.props.requestAlerts();
        }

        componentDidMount() {
            this.fetch();
        }

        componentDidUpdate() {
            this.fetch();
        }

        render() {
            return <ComposedComponent {...this.props} />;
        }
    }

    return connect(state => ({
        events: state.resources['/events'],
        companies: state.resources['companies'],
        alerts: state.resources['/alerts'],
        menu: state.menus['calendar'] || {date: new Date(), selected: moment().format('YYYY-MM-DD')}
        }), {
        push: (location) => push(location),
        requestEvents: (args) => requestResource('/events', {postProcess:eventMap}),
        requestAlerts: requestAlerts,
        requestCompanies: () => requestResource('companies'),
        deleteEvent: (id) => deleteResource(`/event/${id}`),
        addNotification: (args) => addNotification(args),
        updateMenu: (date) => updateMenu('calendar', {date: date, selected: moment(date).format('YYYY-MM-DD')})

    })(Calendar);

}

@CalendarHOC
export default class CalendarFull extends React.Component {
    constructor() {
        super();
        this.selectDay = ::this.selectDay;
        this.deleteEvent = ::this.deleteEvent;
    }

    selectDay(value) {
        this.props.updateMenu(value)
    }

    deleteEvent(id){
        this.props.deleteEvent(id)
            .then(() => this.props.addNotification({message: STRINGS.calendar.eventDeleted}))
            .catch((response) => this.props.addNotification({message: response.message, error: true}))
    }

    showSelected() {
        const selected = this.props.menu.selected;
        let eventList = [], alertList = [];
        if(this.props.events && this.props.events.data && this.props.events.data.eventMap[selected]){
            eventList = this.props.events.data.eventMap[selected]
        }
        if(this.props.alerts && this.props.alerts.data && this.props.alerts.data.dateMap[selected]){
            alertList = this.props.alerts.data.dateMap[selected].reduce((acc, company) => {
                if(company.deadlines){
                    Object.keys(company.deadlines).map(k => {
                        acc.push({deadlineType: k, deadline: company.deadlines[k], companyName: company.companyName, companyId: company.id})
                    });
                }
                if(company.transaction){
                    acc.push({transaction: company.transaction, companyName: company.companyName, companyId: company.id})
                }
                return acc;
            }, []);
        }
        return <EventSummaries deleteEvent={this.deleteEvent} eventList={eventList} alertList={alertList} companies={this.props.companies} {...this.props.menu} />
    }

    showFullView() {
        return <div className="row">
            <div className="col-md-6">
                <div className="calendar-big">
                <Calendar
                    onChange={this.selectDay}
                    dayComponent={DayWithData({
                        events: this.props.events,
                        companies: this.props.companies,
                        alerts: this.props.alerts,
                        selected: this.props.menu.selected,
                        today: moment().format('YYYY-MM-DD'),
                    })}  />
                    </div>
                <div className="button-row">
                        <Link to={{ pathname: "/calendar/create" , query: { date: this.props.menu.selected || ''} }} className="btn btn-info">Create Event</Link>
                    </div>
            </div>
            <div className="col-md-6">
                { this.props.menu.selected && this.showSelected() }
            </div>
        </div>
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

                <div className="widget-body calendar-full">
                    { this.props.children && React.cloneElement(this.props.children, {
                            close: () => this.props.push('/'+this.props.route.path),
                            events: this.props.events,
                            companies: this.props.companies
                    })}
                    { !this.props.children && this.showFullView() }
                </div>
            </div>
        </LawContainer>
    }
}


@CalendarHOC
export class CalendarWidget extends React.Component {
    constructor() {
        super();
        this.selectDay = ::this.selectDay;
    }

    selectDay(value) {
        this.props.updateMenu(value);
        this.props.push("/calendar");
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
                <Calendar
                    onChange={this.selectDay}
                    dayComponent={DayWithData({
                        events: this.props.events,
                        alerts: this.props.alerts,
                        companies: this.props.companies,
                        today: moment().format('YYYY-MM-DD'),
                    })}  />
                <div className="button-row">
                    <Link to ="/calendar/create" className="btn btn-info">Create Event</Link>
                </div>
            </div>
        </div>
    }
}

const PERIODS = ['-PT10M', '-PT30M', '-PT1H', '-P1D', '-P1W', '-P2W', '-P30D']

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
            <Input type="select" {...this.formFieldProps('reminder', STRINGS.calendar) }>
                <option>None</option>
                { PERIODS.map((p, i) => <option key={i} value={p}>{STRINGS.calendar.durations[p]}</option>) }
            </Input>
        </form>
    }
}

const EventFormConnected = reduxForm({
    fields: ['date', 'companyId', 'title', 'description', 'location', 'reminder'],
    form: 'newEvent',
    validate: requireFields('date', 'title')
})(EventForm)


function companyOptions(companies) {
    return [
        <option key={-1}></option>,
        ...(((companies || {}).data || []).map((c, i) =>
            <option value={c.id} key={i}>{c.currentCompanyState.companyName}</option>
    ))];
}


@connect(undefined, {
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

    render() {
        const {location: {query: {date}}} = this.props;
        const dateValue = date ? moment(date, 'YYYY-MM-DD').toDate() : new Date();
        return <div>
            <EventFormConnected initialValues={{date: dateValue}} companyOptions={companyOptions(this.props.companies)} onSubmit={this.handleSubmit} ref='form'/>
                <div className="button-row">
                <Button onClick={this.props.close}>Cancel</Button>
                <Button bsStyle="primary" onClick={() => this.refs.form.submit()}>{ STRINGS.calendar.create}</Button>
            </div>
        </div>
    }
}

@connect(undefined, {
    addNotification: (args) => addNotification(args),
    updateEvent: (id, args) => updateResource(`/event/${id}`, args)
})
export  class EditEventUnpopulated extends React.Component {
    constructor(props) {
        super(props);
        this.handleSubmit = ::this.handleSubmit;
    }

    handleSubmit(values) {
        const {companyId, date, ...data} = values;
        return this.props.updateEvent(this.props.event.id, {companyId, date, data})
            .then(() => {
                this.props.addNotification({message: 'Event Updated'});;
                this.props.close();
            })
            .catch((err) => {
                this.props.addNotification({message: err.message, error: true});
            })
    }
    render() {

        return <div>
            <EventFormConnected initialValues={this.props.event} companyOptions={companyOptions(this.props.companies)} onSubmit={this.handleSubmit} ref='form'/>
                <div className="button-row">
                <Button onClick={this.props.close}>Cancel</Button>
                <Button bsStyle="primary" onClick={() => this.refs.form.submit()}>{ STRINGS.calendar.update}</Button>
            </div>
        </div>
    }
}


export const EditEvent = (props) => {
    if(!props.events || !props.events.data){
        return <Loading />
    }
    const eventId = props.params.eventId|0;
    const event = props.events.data.eventList.filter(e => e.id === eventId)[0];
    return <EditEventUnpopulated {...props} event={{...event, date: new Date(event.date), ...event.data}} />
}

