


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
