"use strict";
import React, {PropTypes} from 'react';
import isoFetch from 'isomorphic-fetch';
import STRINGS from './strings'
import { Link } from 'react-router';
import moment from 'moment';

export function fieldStyle(field){
    if(!field.touched){
        return;
    }
    if(field.error){
        return 'error';
    }
    if(field.valid){
        return 'success';
    }
}

export function fieldHelp(field, help){
    if(field.touched && field.error){
        return Array.isArray(field.error) ? field.error[0] : field.error;
    }
    if(help){
        return help;
    }
}


export function validateWithSchema(schema){
    return (form) => {
        const errors = {};
        Object.keys(schema).map(key=>{
            schema[key].map(validation => {
                if(!validation.test(form[key], form)){
                    errors[key] = [...(errors[key] || []), validation.message]
                }
            })
        });
        return errors;
    }
}



var shallowCompare = require('react-addons-shallow-compare');

/**
 * Tells if a component should update given it's next props
 * and state.
 *
 * @param object nextProps Next props.
 * @param object nextState Next state.
 */
function shouldComponentUpdate(nextProps, nextState) {
  return shallowCompare(this, nextProps, nextState);
}

/**
 * Makes the given component "pure".
 *
 * @param object component Component.
 */
export function pureRender(component) {
  component.prototype.shouldComponentUpdate = shouldComponentUpdate;
}



export function formFieldProps(args = {}){
    return (component) => {
        component.prototype.formFieldProps = function(name, strings=STRINGS) {
            let field;
            if(Array.isArray(name)){
                field = name.reduce((acc, f) => acc[f], this.props.fields);
            }
            else{
                field = this.props.fields ? this.props.fields[name] : this.props[name];
            }
            return {
                 ...field,
                    bsStyle: fieldStyle(field),
                    label: strings[Array.isArray(name) ? name[name.length-1] : name] || name,
                    labelClassName: args.labelClassName,
                    wrapperClassName: args.wrapperClassName,
                    hasFeedback: true,
                    help: fieldHelp(field, strings[`${Array.isArray(name) ? name[name.length-1] : name}Help`])
                }
        }
       return component;
    }
}


export function* objectValues(obj) {
  for (let prop of Object.keys(obj)) {
    yield obj[prop];
  }
}

// delete
export function fieldExistence(form){
    const errors = {};
    if(!form.email){
        errors.email = ['Must supply email'];
    }
    if(!form.username){
        errors.username = ['Must supply username'];
    }
    return errors;
}

//TODO, replace with below
export function requiredFields(fields, values){
    const errors = {};
    fields.map(f => {
        if(!values[f]){
            errors[f] = ['Required'];
        }
    });
    return errors;
}

export function requireFields(...names){
    return data =>
      names.reduce((errors, name) => {
        if (!data || !data[name]) {
          errors[name] = ['Required'];
        }
        return errors;
      }, {});
}


let _fetch = isoFetch;

export function fetch(url, args){
   return _fetch(url, args);
}

export function setFetch(func){
    _fetch = func;
}


export function numberWithCommas(x) {
    const parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

export function stringDateToFormattedString(date){
    return moment(date).format('D MMM YYYY')
    //use moment
    //const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    //const d = new Date(date);
    //return [d.getDate() , MONTHS[d.getMonth()] , d.getFullYear()].join(' ');
}


export function stringDateToFormattedStringTime(date){
    return moment(date).format('h:mma D MMM YYYY')
}


export function debounce(func, delay = 100) {
    let timeout;
    return function(){
        const args = arguments;
        if (timeout)
            clearTimeout(timeout)
        timeout = setTimeout(() => {
            func(...args);
        }, delay);
    };
}

export function renderDocumentLinks(list){
    return list.map((d, i) =>
        <div key={i}><Link  activeClassName="active" className="nav-link" to={"/document/view/"+d.id} >
            {d.filename}
        </Link></div>);
}


export function joinAnd(items=[], options={}){
    if(!items.length){
        return "UNKNOWN"
    }
    if(options.prop){
        if(items.length === 1){
            return (items[0] || {})[options.prop]
        }
        items = items.map(i => (i||{})[options.prop]);
    }
    else{
        if(items.length === 1){
            return items[0];
        }
    }
    return `${items.slice(0, items.length-1).join(', ')} and ${items[items.length-1]}`;
}

export function newHoldingString(newHolding){
    const names = joinAnd(newHolding.persons, {prop: 'name'});
    return 'New Holding: ' + (newHolding.holdingName ? newHolding.holdingName + ' - ' + names :  names);
}

export function personList(companyState){
    const persons = companyState.holdingList.holdings.reduce((acc, h) => {
        return h.holders.reduce((acc, p) => {
            acc[p.person.personId] = {...p.person}
            return acc;
        }, acc);
    }, {});
    const orderedPersons = Object.keys(persons).map(k => {
        return {id: k, ...persons[k]};
    })
    orderedPersons.sort((a, b) => a.name.localeCompare(b.name));
    return orderedPersons;
}

export function personOptionsFromState(companyState){
    return personList(companyState).map((p, i) => <option key={i} value={p.personId}>{p.name}</option>);
}


export function populatePerson(person, companyState){
    //TODO, make a store or something
    if(person.newPerson){
        return person.newPerson;
    }
    else{
        const id = parseInt(person.personId);
        let result;
        companyState.holdingList.holdings.map((h) => {
            h.holders.map((p) => {
                if(p.person.personId === id){
                    result = {name: p.person.name, address: p.person.address, personId: p.person.personId, companyNumber: p.person.companyNumber};
                }
            });
        });
        companyState.directorList.directors.map((d) => {
            if(d.person.personId === id){
                result = {name: d.person.name, address: d.person.address, personId: d.person.personId};
            }
        });
        return result;
    }
}


export function generateShareClassMap(companyState){
    if(companyState && companyState.shareClasses && companyState.shareClasses.shareClasses){
        return companyState.shareClasses.shareClasses.reduce((acc, s) => {
            acc[s.id] = s;
            return acc;
        }, {});
    }
    return {};
}


export function renderShareClass(shareClass, shareClassMap = {}){
    const result = shareClassMap[shareClass] ? shareClassMap[shareClass].name : STRINGS.defaultShareClass;
    return result;
}


export function formatString(formatted) {
    for (var i = 1; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+(i-1)+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};


export function sortAlerts(response) {
    const data = (response || [])
    data.sort((a, b) => {
        return ((a.deadlines || {}).overdue ? 1 : -1) - ((b.deadlines || {}).overdue ? 1 : -1)
    });
    const companyMap = (data || []).reduce((acc, entry) => {
        acc[entry.id] = entry;
        return acc;
    }, {});
    const dateMap = (data || []).reduce((acc, entry) => {
        if(entry.deadlines){
            Object.keys(entry.deadlines).map(k => {
                const deadline = entry.deadlines[k];
                if(deadline){
                    const due = moment(deadline.dueDate).format('YYYY-MM-DD');
                    acc[due] = acc[due] || [];
                    acc[due].push({id: entry.id, companyName: entry.companyName, deadlines: {[k]: deadline}})
                }
            })
        }
        (entry.futureTransactions || []).map(transaction => {
            const due = moment(transaction.effectiveDate).format('YYYY-MM-DD');
            acc[due] = acc[due] || [];
            acc[due].push({id: entry.id, companyName: entry.companyName, transaction: transaction})

            if(transaction.subTransactions[0].data.noticeDate){
                const noticeDue = moment(transaction.subTransactions[0].data.noticeDate).format('YYYY-MM-DD');
                acc[noticeDue] = acc[noticeDue] || [];
                acc[noticeDue].push({id: entry.id, companyName: entry.companyName, noticeDate: true, transaction: transaction})
            }
        })

        return acc;
    }, {});
    return {alertList: data, companyMap, dateMap}
}

