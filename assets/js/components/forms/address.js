"use strict";
import React from 'react';
import { pureRender,  debounce, fieldStyle } from '../../utils';
import { lookupAddressChange} from '../../actions';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Autosuggest from 'react-autosuggest';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { push } from 'react-router-redux'
import RootCloseWrapper from 'react-overlays/lib/RootCloseWrapper';
import { Link, IndexLink } from 'react-router';
import Loading from '../loading';
import Input from './input'


function canDoAddressLookup(props){
    return props.userInfo.mbieServices.indexOf('companies-office') >= 0;;
}

function addressString(suggestion){
    return [suggestion.address1, suggestion.address2, suggestion.address3, suggestion.postCode, suggestion.countryCode]
        .filter(f => f)
        .join(', ');

}

function renderSuggestion(suggestion, { value, valueBeforeUpDown }) {
    value = valueBeforeUpDown || value;
    const address = addressString(suggestion)
    return (
        <div>
            <h5 className="list-group-item-heading">{ address }</h5>
        </div>
    );
}

function renderSectionTitle(section) {
  return (<div className="section-title"><h4>{section.title}</h4></div>);
}

function getSectionSuggestions(section) {
  return section.list;
}

function mapDispatchToProps(dispatch, ownProps) {
    return {
        onSuggestionsUpdateRequested: ({value, force}) => {
            if(value !== ownProps.value || force){
                dispatch(lookupAddressChange(value));
            }
        }
    };
}


function renderLoading(){
    return <div><Loading/></div>
}

const theme = {
    container: 'auto-suggest',
    containerOpen: 'open',
    suggestionsContainer: 'suggest-container',
    input: 'form-control input',
    sectionSuggestionsContainer: 'list-group',
    suggestion: 'list-group-item actionable',
    suggestionFocused: 'active'
};

const LOADING_DEFAULT =   [{title: 'Address Lookup', list: [{}]}];

@connect((state, ownProps) => ({lookupAddress: state.lookupAddress, userInfo: state.userInfo}), mapDispatchToProps)
export default class Address extends React.PureComponent {

    // add proptypes

    constructor() {
        super();
        this.handleSelect = ::this.handleSelect;
        this.handleFocus = ::this.handleFocus;
        this.state = {suggestions: []};
    }

    handleFocus(e) {
        this.props.onFocus(e);
        if(this.props.value){
            this.props.onSuggestionsUpdateRequested({value: this.props.value, force: true});
        }
    }


    handleSelect(event, { suggestion, suggestionValue, sectionIndex, method }){
        this.props.onChange(addressString(suggestion))
    }

    renderIcon(style) {
        switch (style) {
            case 'success': return <Glyphicon className="form-control-feedback" glyph="ok" key="icon" />;
            case 'warning': return <Glyphicon className="form-control-feedback" glyph="warning-sign" key="icon" />;
            case 'error': return <Glyphicon className="form-control-feedback" glyph="remove" key="icon" />;
            default: return <span className="form-control-feedback" key="icon" />;
        }
    }

    render() {
        if(!canDoAddressLookup(this.props)){
            return <Input type="text" {...this.props} />
        }
        const { value, onSuggestionsUpdateRequested, onChange, onTouch } = this.props;
        const suggestions = [];
        let noSuggestions = false;
        const loading = this.props.lookupAddress._status === 'fetching';

        if(this.props.lookupAddress.list.length && !loading){
            suggestions.push({
                title: 'Address Lookup',
                list: this.props.lookupAddress.list
            });
        }
        if(this.props.lookupAddress._status === 'complete' &&
            suggestions.length === 0 && value){
            noSuggestions = true;
        }


        const inputProps = {
            value: value || '',
            onChange: onChange,
            onFocus: this.handleFocus,
            onBlur: this.props.onBlur
        };
        const required = this.props.error && this.props.error.indexOf('Required') >= 0;
        const labelClass='control-label' + (required ? ' required' : '');
        let feedback = fieldStyle(this.props);
        return (
            <div className={"form-group has-feedback " + (feedback ? 'has-'+feedback : '')}>
                <label className={labelClass}>{ this.props.label }</label>
                <Autosuggest theme={theme}
                    multiSection={true}
                    suggestions={loading ? LOADING_DEFAULT : suggestions}
                    onSuggestionsFetchRequested={onSuggestionsUpdateRequested}
                    onSuggestionsClearRequested={() => {}}
                    onSuggestionSelected={loading ? null: this.handleSelect}
                    getSuggestionValue={addressString}
                    getSectionSuggestions={ getSectionSuggestions }
                    renderSuggestion={loading ? renderLoading : renderSuggestion}
                    renderSectionTitle={ renderSectionTitle }
                    inputProps={inputProps} />
                { this.renderIcon(feedback) }

            </div>
        );
    }
}


