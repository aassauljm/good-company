import isoFetch from 'isomorphic-fetch';


export function fieldStyle(field){
    return field.error && field.touched ? 'error': null;
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
 * Will help interface with a wrapped form
 *
 */
export function formWrapperHelper(component){
    component.prototype.touchAll = function(){
        this.subForms.map((ref)=>{
            this.refs[ref].touchAll()
        });
    };

    component.prototype.isValid = function(){
        return this.subForms.map((ref)=>{
            return this.refs[ref].isValid()
        }).every(x => x);
    };
}



/**
* The next functions are super lame, im hiding dodgy code in them.
*
* They allow a formProxy to access a formProxyable, when a react-forms wrapper
* is sitting in between them.
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
        this.props.keyList.map((d, i) => {
            this._REFHACK[d].touchAll ? this._REFHACK[d].touchAll() : this._REFHACK[d].props.touchAll();
        });
    }

    component.prototype.isValid = function(){
        return  this.props.keyList.map((d, i) => {
            return this._REFHACK[d].isValid ? this._REFHACK[d].isValid() :  this._REFHACK[d].props.valid;
        }).every(x => x)
    }

    component.prototype.getValues = function(){
       // do in morning
    }

    component.prototype.register = function(key){
        const self = this;
        prep.call(this);
        return (child) => {
            self._REFHACK[key] = child;
        }
    }
    component.prototype.unregister = function(key){
        const self = this;
        return () => {
            delete self._REFHACK[key]
        }
    }
}


export function* objectValues(obj) {
  for (let prop of Object.keys(obj)) {
    yield obj[prop];
  }
}

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

export function requiredFields(fields, values){
    const errors = {};
    fields.map(f => {
        if(!values[f]){
            errors[f] = ['Required'];
        }
    });
    return errors;
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
    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const d = new Date(date);
    return [d.getDate() , MONTHS[d.getMonth()] , g.getYear()].join(' ');
}