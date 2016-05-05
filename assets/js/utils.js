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

export function fieldHelp(field){
    if(!field.touched){
        return;
    }
    if(field.error){
        return Array.isArray(field.error) ? field.error[0] : field.error;
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


/**
* The next functions are super lame, im hiding dodgy code in them.
*
* They allow a formProxy to access a formProxyable, when a react-forms wrapper
* is sitting in between them.
*
* REPLACE WITH SOME ACTION DISPATCHES
* will get rid of getValues first, thats easist
*/
export function formProxyable(component){
    const mount = component.prototype.componentWillMount;
    component.prototype.componentWillMount = function(nextProps) {
        this.props.register(this);
        mount && mount.call(this, nextProps);
    };
    const unmount = component.prototype.componentWillUnmount;
    component.prototype.componentWillUnmount = function(nextProps) {
        unmount && unmount.call(this, nextProps);
        this.props.unregister(this);
    };
}

export function formProxy(component){

    function prep(){
        this._REFHACK = this._REFHACK || {};
    }

    component.prototype.touchAll = function(){
        if(!this.subForms && !this.props.keyList){
            return this._REFHACK.props.touchAll();
        }
        if(this.subForms){
            return this.subForms.map((ref)=>{
                this.refs[ref].touchAll()
            });
        }
        this.props.keyList.map((d, i) => {
            this._REFHACK[d].touchAll ? this._REFHACK[d].touchAll() : this._REFHACK[d].props.touchAll();
        });
    }

    component.prototype.isValid = function(){
        if(!this.subForms && !this.props.keyList){
            return this._REFHACK.props.valid;
        }
        if(this.subForms){
            return this.subForms.map((ref)=>{
                return this.refs[ref].isValid()
            }).every(x => x);
        }
        return  this.props.keyList.map((d, i) => {
            return this._REFHACK[d].isValid ? this._REFHACK[d].isValid() :  this._REFHACK[d].props.valid;
        }).every(x => x)
    }

    component.prototype.getValues = function(){
        if(!this.subForms && !this.props.keyList){
            return this._REFHACK.props.values;
        }
        if(this.subForms){
            // do in morning
            return this.subForms.reduce((acc, ref)=>{
                acc[ref] = this.refs[ref].getValues();
                return acc;
            }, {})
        }
        return this.props.keyList.map((d, i) => {
            return this._REFHACK[d].getValues ? this._REFHACK[d].getValues():  this._REFHACK[d].props.values
        })
    }

    component.prototype.register = function(key){
        const self = this;
        prep.call(this);
        return (child) => {
            if(key){
                self._REFHACK[key] = child;
            }
            else{
                self._REFHACK = child;
            }
        }
    }
    component.prototype.unregister = function(key){
        const self = this;
        return () => {
            delete self._REFHACK[key]
        }
    }
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
                    label: strings[Array.isArray(name) ? name[name.length-1] : name],
                    labelClassName: args.labelClassName,
                    wrapperClassName: args.wrapperClassName,
                    hasFeedback: true,
                    help: fieldHelp(field)
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

export function stringToDate(date){
    return moment(date).format('D MMM YYYY')
    //use moment
    //const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    //const d = new Date(date);
    //return [d.getDate() , MONTHS[d.getMonth()] , d.getFullYear()].join(' ');
}


export function stringToDateTime(date){
    return moment(date).format('h:ma D MMM YYYY')
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
    else if(items.length === 1){
        return (items[0] || {})[options.prop]
    }
    else{
        items = items.map(i => (i||{})[options.prop]);
        return `${items.slice(0, items.length-1).join(', ')} and ${items[items.length-1]}`;
    }
}

export function newHoldingString(newHolding){
    const names = joinAnd(newHolding.persons, {prop: 'name'});
    return 'New Holding: ' + (newHolding.holdingName ? newHolding.holdingName + ' - ' + names :  names);
}

export function personList(companyState){
    const persons = companyState.holdingList.holdings.reduce((acc, h) => {
        return h.holders.reduce((acc, p) => {
            acc[p.personId] = {name: p.name, address: p.address}
            return acc;
        }, acc);
    }, {});
    const orderedPersons = Object.keys(persons).map(k => {
        return {id: k, ...persons[k]};
    })
    orderedPersons.sort((a, b) => a.name.localeCompare(b));
    return orderedPersons;
}

export function personOptionsFromState(companyState){
    return personList(companyState).map((p, i) => <option key={i} value={p.id}>{p.name}</option>);
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
                if(p.personId === id){
                    result = {name: p.name, address: p.address, personId: p.personId};
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



