"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import FormControl from 'react-bootstrap/lib/FormControl';
import classNames from 'classnames';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { splitBsProps } from 'react-bootstrap/lib/utils/bootstrapUtils';
import DropdownList from 'react-widgets/lib/DropdownList';
import Combobox from 'react-widgets/lib/Combobox';


const DROPLIST_THRESHOLD = 20;


class FormGroup extends React.Component {
  render() {
    let classes = {
      'form-group': !this.props.standalone,
      'form-group-lg': !this.props.standalone && this.props.bsSize === 'large',
      'form-group-sm': !this.props.standalone && this.props.bsSize === 'small',
      'has-feedback': this.props.hasFeedback,
      'has-success': this.props.bsStyle === 'success',
      'has-warning': this.props.bsStyle === 'warning',
      'has-error': this.props.bsStyle === 'error'
    };

    return (
      <div className={classNames(classes, this.props.groupClassName)}>
        {this.props.children}
      </div>
    );
  }
}

FormGroup.defaultProps = {
  hasFeedback: false,
  standalone: false
};

FormGroup.propTypes = {
  standalone: PropTypes.bool,
  hasFeedback: PropTypes.bool,
  bsSize(props) {
    if (props.standalone && props.bsSize !== undefined) {
      return new Error('bsSize will not be used when `standalone` is set.');
    }

    return PropTypes.oneOf(['small', 'medium', 'large'])
      .apply(null, arguments);
  },
  bsStyle: PropTypes.oneOf(['success', 'warning', 'error']),
  groupClassName: PropTypes.string
};




class InputBase extends React.Component {
  getInputDOMNode() {
    return this.refs.input;
  }

  getValue() {
    if (this.props.type === 'static') {
      return this.props.value;
    } else if (this.props.type) {
      if (this.props.type === 'select' && this.props.multiple) {
        return this.getSelectedOptions();
      }
      return this.getInputDOMNode().value;
    }
    throw new Error('Cannot use getValue without specifying input type.');
  }

  getChecked() {
    return this.getInputDOMNode().checked;
  }

  getSelectedOptions() {
    let values = [];

    Array.prototype.forEach.call(
      this.getInputDOMNode().getElementsByTagName('option'),
      (option) => {
        if (option.selected) {
          let value = option.getAttribute('value') || option.innerHtml;
          values.push(value);
        }
      });

    return values;
  }

  isCheckboxOrRadio() {
    return this.props.type === 'checkbox' || this.props.type === 'radio';
  }

  isFile() {
    return this.props.type === 'file';
  }

  renderInputGroup(children) {
    let addonBefore = this.props.addonBefore ? (
      <span className="input-group-addon" key="addonBefore">
        {this.props.addonBefore}
      </span>
    ) : null;

    let addonAfter = this.props.addonAfter ? (
      <span className="input-group-addon" key="addonAfter">
        {this.props.addonAfter}
      </span>
    ) : null;

    let buttonBefore = this.props.buttonBefore ? (
      <span className="input-group-btn">
        {this.props.buttonBefore}
      </span>
    ) : null;

    let buttonAfter = this.props.buttonAfter ? (
      <span className="input-group-btn">
        {this.props.buttonAfter}
      </span>
    ) : null;

    let inputGroupClassName;
    switch (this.props.bsSize) {
    case 'small': inputGroupClassName = 'input-group-sm'; break;
    case 'large': inputGroupClassName = 'input-group-lg'; break;
    default:
    }

    return addonBefore || addonAfter || buttonBefore || buttonAfter ? (
      <div className={classNames(inputGroupClassName, 'input-group')} key="input-group">
        {addonBefore}
        {buttonBefore}
        {children}
        {addonAfter}
        {buttonAfter}
      </div>
    ) : children;
  }

  renderIcon() {
    if (this.props.hasFeedback) {
      if (this.props.feedbackIcon) {
        return React.cloneElement(this.props.feedbackIcon, { formControlFeedback: true });
      }

      switch (this.props.bsStyle) {
      case 'success': return <Glyphicon className="form-control-feedback" glyph="ok" key="icon" />;
      case 'warning': return <Glyphicon className="form-control-feedback" glyph="warning-sign" key="icon" />;
      case 'error': return <Glyphicon className="form-control-feedback" glyph="remove" key="icon" />;
      default: return <span className="form-control-feedback" key="icon" />;
      }
    } else {
      return null;
    }
  }

  renderHelp() {
    return this.props.help ? (
      <span className="help-block" key="help">
        {this.props.help}
      </span>
    ) : null;
  }

  renderCheckboxAndRadioWrapper(children) {
    let classes = {
      'checkbox': this.props.type === 'checkbox',
      'radio': this.props.type === 'radio'
    };

    return (
      <div className={classNames(classes)} key="checkboxRadioWrapper">
        {children}
      </div>
    );
  }

  renderWrapper(children) {
    return this.props.wrapperClassName ? (
      <div className={this.props.wrapperClassName} key="wrapper">
        {children}
      </div>
    ) : children;
  }

  renderLabel(children) {
    let classes = {
      'control-label': !this.isCheckboxOrRadio(),
      'required': this.props.required
    };
    classes[this.props.labelClassName] = this.props.labelClassName;

    return this.props.label ? (
      <label htmlFor={this.props.id} className={classNames(classes)} key="label">
        {children}
        {this.props.label}
      </label>
    ) : children;
  }

  renderInput() {
    // strip values
    const { _originalOnChange, ...elementProps } = getValidInputProps(this.props);

    if (!this.props.type) {
      return this.props.children;
    }

    switch (this.props.type) {
        case 'select':
            const children = React.Children.toArray(this.props.children);
            if(children.length > DROPLIST_THRESHOLD && !this.props.forceSelect){
                const valueMap = {};
                return <DropdownList {...elementProps} valueField='value' textField='text' key='dropdown'
                    data={ children.filter(c => c.props.value).map(c => ({value: c.props.value, text: Array.isArray(c.props.children) ? c.props.children.join('') : c.props.children }))}
                    caseSensitive={false}
                    filter={'contains'}
                    children={null}
                     />

            }
            else{
                return (
                <select {...elementProps} value={elementProps.value||''} className={classNames(this.props.className, 'form-control')} ref="input" key="input">
                  {this.props.children}
                </select>);
            }
        case 'textarea':
          return <textarea {...elementProps} value={elementProps.value||''} className={classNames(this.props.className, 'form-control')} ref="input" key="input" />;
        case 'static':
          return (
            <p {...elementProps} className={classNames(this.props.className, 'form-control-static')} ref="input" key="input">
              {this.props.value}
            </p>
          );
        default:
          const className = this.isCheckboxOrRadio() || this.isFile() ? '' : 'form-control';
          if(this.isCheckboxOrRadio()){
                delete elementProps.value;
                elementProps.checked = elementProps.checked || false;
          }
          if (this.props.comboData && this.props.comboData.length) {
            return <Combobox  ref="combo" {...elementProps} data={this.props.comboData}  key="input"
                onBlur={null}
                onFocus={(event) => {
                   if(event.target.tagName === 'INPUT'){
                        this.refs.combo && this.refs.combo.getControlledInstance() &&this.refs.combo.getControlledInstance().open();
                    }
                }}
                />
          }
          if(elementProps.onChange){
                elementProps.value = elementProps.value === undefined ? '' : elementProps.value
          }
          return <input {...elementProps}  className={classNames(this.props.className, className)} ref="input" key="input" />;
        }
  }

  renderFormGroup(children) {
    return <FormGroup {...this.props}>{children}</FormGroup>;
  }

  renderChildren() {
    return !this.isCheckboxOrRadio() ? [
      this.renderLabel(),
      this.renderWrapper([
        this.renderInputGroup(
          this.renderInput()
        ),
        this.renderIcon(),
        this.renderHelp()
      ])
    ] : this.renderWrapper([
      this.renderCheckboxAndRadioWrapper(
        this.renderLabel(
          this.renderInput()
        )
      ),
      this.renderHelp()
    ]);
  }

  render() {
    let children = this.renderChildren();
    return this.renderFormGroup(children);
  }
}

InputBase.propTypes = {
  type: PropTypes.string,
  label: PropTypes.node,
  help: PropTypes.node,
  addonBefore: PropTypes.node,
  addonAfter: PropTypes.node,
  buttonBefore: PropTypes.node,
  buttonAfter: PropTypes.node,
  bsSize: PropTypes.oneOf(['small', 'medium', 'large']),
  bsStyle: PropTypes.oneOf(['success', 'warning', 'error']),
  hasFeedback: PropTypes.bool,
  feedbackIcon: PropTypes.node,
  id: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  groupClassName: PropTypes.string,
  wrapperClassName: PropTypes.string,
  labelClassName: PropTypes.string,
  multiple: PropTypes.bool,
  disabled: PropTypes.bool,
  value: PropTypes.any
};

InputBase.defaultProps = {
  disabled: false,
  hasFeedback: false,
  multiple: false
};

export function getValidInputProps(props){
    const {initialValue, autofill, onUpdate, valid, invalid, dirty, pristine, error, active,
        touched, visited, autofilled, help, hasFeedback, bsStyle, labelClassName, bsSize, standalone,
        wrapperClassName, groupClassName, buttonAfter, comboData, ...elementProps} = props;
    return elementProps;
}

export default InputBase;
