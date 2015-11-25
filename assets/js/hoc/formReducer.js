"use strict";
import React from 'react';
import { connect } from 'react-redux';

/** Collects form data from multiple connected forms.
*/
export class FormReducer extends React.Component {
    getValues() {
        const rootForms = this.props.form;
        function getFormModel(path){
            return rootForms[{
                'directors': 'person',
                'holders': 'person',
                'shareClasses': 'shareClass',
                'parcels': 'parcel',
                'holdings': 'holding'
            }[path[path.length-1]] || path[path.length-1]] || {}
        }
        const values = (function getValues(formData, path = []){
            if(!formData){
                return {};
            }
            function getDeep(path, id){
                const formModel = getFormModel(path);
                const currentForm = formModel[[...path, id].join('.')]
                return currentForm || {}
            }
            return Object.keys(formData).reduce((acc, key) => {
                if(key[0] === "_"){
                    return acc;
                }
                if(formData[key].list){
                    acc[key] =  formData[key].list.map(id => {
                        return {...getValues(getDeep([...path, key], id)), ...getValues(formData[key][id], [...path, key, id]) }
                    })
                }
                else{
                    acc[key] = formData[key].value
                }
                return acc;
            }, {});

        })(this.props.form[this.props.formName][this.props.formKey], [this.props.formKey]);
        return values;
    }

    cleanUpForms() {

    }

    componentWillUnmount() {
    }

    render() {
        const formValues = this.getValues();

        return <div>{ React.Children.map(this.props.children, child => {
            return React.cloneElement(child, {formValues: formValues, formName: this.props.formName, formKey: this.props.formKey});
        }) }
    </div>
    }
}


export default connect(state => ({ form: state.form }))(FormReducer);