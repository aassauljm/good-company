import isoFetch from 'isomorphic-fetch';
import STRINGS from './strings'

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
        return field.error[0];
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

export function formFieldProps(args){
    return (component) => {
        component.prototype.formFieldProps = function(name) {
            const field = this.props.fields ? this.props.fields[name] : this.props[name];
            return {
                 ...field,
                    bsStyle: fieldStyle(field),
                    label: STRINGS[name],
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

export const requireFields = (...names) => data =>
  names.reduce((errors, name) => {
    if (!data || !data[name]) {
      errors[name] = ['Required'];
    }
    return errors;
  }, {});


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
    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const d = new Date(date);
    return [d.getDate() , MONTHS[d.getMonth()] , g.getYear()].join(' ');
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