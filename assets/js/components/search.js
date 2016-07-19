"use strict";
import React from 'react';
import { pureRender,  debounce } from '../utils';
import { lookupCompany, lookupOwnCompany } from '../actions';
import Autosuggest from 'react-autosuggest';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { push } from 'react-router-redux'


function highlightString(string, query, highlightClass='highlight'){
    return string;
    // not doing currently
    const startIndex = string.toLowerCase().indexOf(query.toLowerCase()),
            endIndex = startIndex + query.length;
    if(startIndex < 0){
        return string;
    }
    return  [<span>{string.substring(0, startIndex)}</span>,
    <span className={highlightClass}>{string.substring(startIndex, endIndex)}</span>,
    <span>{string.substring(endIndex)}</span>];
}



function getSuggestionValue(suggestion) {
  return suggestion.companyName;
}

function renderSuggestion(suggestion, { value, valueBeforeUpDown }) {
    value = valueBeforeUpDown || value;
    if(suggestion.companiesOffice){
        return (
            <div>
                <h5 className="list-group-item-heading">{highlightString(suggestion.companyName, value)}</h5>
                { (suggestion.notes || []).map((s, i) => <p key={i} className="list-group-item-text"><em>{highlightString(s,value)}</em></p> ) }
            </div>
        );
    }
    else{
      return (
        <div>
            <h5 className="list-group-item-heading">{highlightString(suggestion.companyName, value)}</h5>
            <p className="list-group-item-text"><strong>Company Number:</strong> {suggestion.companyNumber}</p>
            <p className="list-group-item-text"><strong>NZBN:</strong> {suggestion.nzbn}</p>
            </div>
    );
    }
}

function renderSectionTitle(section) {
  return (<div className="section-title"><h4>{section.title}</h4></div>);
}

function getSectionSuggestions(section) {
  return section.list;
}

function mapDispatchToProps(dispatch) {
    return {
        onChange(event, { newValue }) {
            dispatch(updateInputValue(newValue));
            const value = newValue.trim();
            if (value === ''){
                dispatch(clearSuggestions());
            }
        },
        onSuggestionsUpdateRequested: debounce(({ value }) => {
            dispatch(lookupOwnCompany(value));
            dispatch(lookupCompany(value));
        }),
        onSelectOwnCompany: (id) => {
            dispatch(push("/company/view/"+ id));
        },
        onSelectCompany: (item) => {
            dispatch(push({pathname: `/import/${item.companyNumber}`,  query: item}));

        }
    };
}

function mapStateToProps(state) {
    return {lookupCompany: state.lookupCompany, lookupOwnCompany: state.lookupOwnCompany};
};



const theme = {
    container: 'auto-suggest',
    containerOpen: 'open',
    suggestionsContainer: 'suggest-container',
    input: 'form-control input-lg',
    sectionSuggestionsContainer: 'list-group',
    suggestion: 'list-group-item actionable',
    suggestionFocused: 'active'
};

export class SearchWidget extends React.Component {

    // add proptypes

    constructor() {
        super();
        this.handleSelect = ::this.handleSelect;
    }

    handleSelect(event, { suggestion, suggestionValue, sectionIndex, method }){
        if(!suggestion.companiesOffice){
            this.props.onSelectOwnCompany(suggestion.id);
        }
        else{
            this.props.onSelectCompany(suggestion);
        }
    }

    render() {
        const { fields, onSuggestionsUpdateRequested } = this.props;
        const suggestions = [];
        let noSuggestions = false;
        if(this.props.lookupOwnCompany.list.length){
            suggestions.push({
                title: 'My Companies',
                list: this.props.lookupOwnCompany.list
            });
        }
        if(this.props.lookupCompany.list.length){
            suggestions.push({
                title: 'Import From Companies Office',
                list: this.props.lookupCompany.list.map(x => ({...x, companiesOffice: true}))
            });
        }

        if(this.props.lookupOwnCompany._status === 'complete' &&
           this.props.lookupCompany._status === 'complete' &&
           suggestions.length === 0){
            noSuggestions = true;
        }

        const inputProps = {
            placeholder: 'Type to find or import your companies',
            value: fields.input.value || '',
            onChange: fields.input.onChange
        };
        console.log(fields.input.value)
        return (
            <div>
                <Autosuggest theme={theme}
                    multiSection={true}
                    suggestions={suggestions}
                    onSuggestionsUpdateRequested={onSuggestionsUpdateRequested}
                    onSuggestionSelected={this.handleSelect}
                    getSuggestionValue={getSuggestionValue}
                    getSectionSuggestions={getSectionSuggestions}
                    renderSuggestion={renderSuggestion}
                    renderSectionTitle={renderSectionTitle}
                    inputProps={inputProps} />

                { (noSuggestions && fields.input.value) && <div className="no-suggestions">
                  No results found
                </div> }
            </div>
        );
    }
}

const SearchWidgetForm = reduxForm({
  form: 'searchForm',
  fields: ['input']
})(SearchWidget);

const ConnectedSearchWidget = connect(mapStateToProps, mapDispatchToProps)(SearchWidgetForm);

export default ConnectedSearchWidget;