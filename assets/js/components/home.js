"use strict";
import React from 'react';
import { pureRender,  debounce } from '../utils';
import { lookupCompany, lookupOwnCompany } from '../actions'
import Autosuggest from 'react-autosuggest';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';

function renderSuggestioncc(suggestion, { value, valueBeforeUpDown }) {
  const suggestionText = `${suggestion.first} ${suggestion.last}`;
  const query = (valueBeforeUpDown || value).trim();
  const matches = AutosuggestHighlight.match(suggestionText, query);
  const parts = AutosuggestHighlight.parse(suggestionText, matches);

  return (
    <span className={'suggestion-content ' + suggestion.twitter}>
      <span className="name">
        {
          parts.map((part, index) => {
            const className = part.highlight ? 'highlight' : null;

            return (
              <span className={className} key={index}>{part.text}</span>
            );
          })
        }
      </span>
    </span>
  );
}

function onSuggestionSelected(event, { suggestion, suggestionValue, sectionIndex, method }){
    console.log(arguments)
}

function getSuggestionValue(suggestion) {
  return suggestion.companyName;
}

function renderSuggestion(suggestion) {
    if(suggestion.companiesOffice){
        return (
            <div>
                <h5 className="list-group-item-heading">{suggestion.companyName}</h5>
                { (suggestion.notes || []).map((s, i) => <p key={i} className="list-group-item-text"><em>{s}</em></p> ) }
            </div>
        );
    }
    else{
      return (
        <div>
            <h4 className="list-group-item-heading">{suggestion.companyName}</h4>
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
            if (value === '') {
                dispatch(clearSuggestions());
            }
        },
        onSuggestionsUpdateRequested: debounce(({ value }) => {
            dispatch(lookupOwnCompany(value));
            dispatch(lookupCompany(value));
        })
    };
}

function mapStateToProps(state) {
    return {lookupCompany: state.lookupCompany, lookupOwnCompany: state.lookupOwnCompany};
};


const theme = {
    container: 'auto-suggest',
    suggestionsContainer: 'suggest-container',
    input: 'form-control input-lg',
    sectionSuggestionsContainer: 'list-group',
    suggestion: 'list-group-item actionable',
    suggestionFocused: 'active'
};

export class SearchWidget extends React.Component {

    render() {
        const { fields, onSuggestionsUpdateRequested } = this.props;

        const suggestions = [];
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
        const inputProps = {
            placeholder: 'Type to find or import your companies',
            value: fields.input.value,
            onChange: fields.input.onChange
        };
        return (
          <Autosuggest theme={theme}
            multiSection={true}
            suggestions={suggestions}
            onSuggestionsUpdateRequested={onSuggestionsUpdateRequested}
            onSuggestionSelected={onSuggestionSelected}
            getSuggestionValue={getSuggestionValue}
            getSectionSuggestions={getSectionSuggestions}
            renderSuggestion={renderSuggestion}
            renderSectionTitle={renderSectionTitle}
            inputProps={inputProps} />
        );
    }
}

const SearchWidgetForm = reduxForm({
  form: 'searchForm',
  fields: ['input']
})(SearchWidget);

const ConnectedSearchWidget = connect(mapStateToProps, mapDispatchToProps)(SearchWidgetForm);


@pureRender
export default class Home extends React.Component {

    render() {
        return  <div className="container">
            <ConnectedSearchWidget />
        </div>
    }
}

