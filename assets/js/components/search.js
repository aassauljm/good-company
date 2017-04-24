"use strict";
import React from 'react';
import { pureRender,  debounce } from '../utils';
import { lookupCompanyChange, lookupOwnCompany } from '../actions';

import Autosuggest from 'react-autosuggest';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { push } from 'react-router-redux'
import { CompaniesHOC  } from '../hoc/resources';
import RootCloseWrapper from 'react-overlays/lib/RootCloseWrapper';
import { Link, IndexLink } from 'react-router';
import Loading from './loading';

export function highlightString(string, query, highlightClass='highlight'){
    const startIndex = string.toLowerCase().indexOf(query.toLowerCase()),
            endIndex = startIndex + query.length;
    if(startIndex < 0){
        return string;
    }
    return  [<span key={0}>{string.substring(0, startIndex)}</span>,
    <span key={1}className={highlightClass}>{string.substring(startIndex, endIndex)}</span>,
    <span key={2}>{string.substring(endIndex)}</span>];
}


const MAX_ITEMS = 20;


@CompaniesHOC()
@connect(state => ({ userInfo: state.userInfo }))
export class Search extends React.Component {
    constructor(props){
        super();
        this.onChange = ::this.onChange;
        this.hide = ::this.hide;
        this.show = ::this.show;
        this.setAndClose = ::this.setAndClose;
        this.state = {value: '', showing: false, list: []};
    }

    onChange(event) {
        this.filter(event.target.value)
    }

    filter(value) {
        const filterCompanies = (value, list) => {
            return (!value ? list : list.filter(l => l.currentCompanyState.companyName.toLocaleLowerCase().indexOf(value) > -1) || []);
        }
        this.setState({show: true, value: value, list: filterCompanies(value.toLocaleLowerCase(), this.props.companies.data || []).slice(0, MAX_ITEMS)});
    }

    hide(e) {
        this.setState({show: false})
    }

    show() {
        this.filter(this.state.value);
    }

    setAndClose(value) {
        this.setState({show: false, value: ''})
    }

    results() {
        const canImport = this.props.userInfo.permissions.company.indexOf('create') >= 0;
        return  this.state.show && <div className="search-results" >
            { this.state.list.map((c, i) => {
                return <Link key={i} className="result" to={this.props.target ? this.props.target(c.id) : `/company/view/${c.id}`} onClick={() => this.setAndClose(c.currentCompanyState.companyName)}><span className="title">{ highlightString(c.currentCompanyState.companyName, this.state.value) }</span></Link>
            }) }
            { canImport && this.state.list.length === 0 && !!this.state.value && <div><div className="no-results">No results</div> <div><Link to='/import' query={{value: this.state.value}} className="result" onClick={this.setAndClose}>Search for '{ this.state.value }' on the Companies Register</Link></div></div> }
            </div>
    }

    render() {
        return <form className="search-form navbar-form" ref="form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
                  <RootCloseWrapper
                    onRootClose={this.hide}
                    event={'click'}>
                <div className={`input-group ${this.state.show  ? 'showing': ''}`} >
                    <input  type="text" className="form-control" placeholder="Search..." value={this.state.value} onChange={this.onChange} onFocus={this.show}  />
                    { this.results() }
                    <span className="input-group-addon" >
                        <span className="fa fa-search"/>
                    </span>
                </div>
            </RootCloseWrapper>
        </div>
    </form>
    }
}





function getSuggestionValue(suggestion) {
  return suggestion.companyName;
}

function renderSuggestion(suggestion, { value, valueBeforeUpDown }) {
    value = valueBeforeUpDown || value;
    if(suggestion.companiesOffice){
        return (
            <div>
                <h5 className="list-group-item-heading">{suggestion.companyName}</h5>
                { (suggestion.notes || []).map((s, i) => <p key={i} className="list-group-item-text"><em>{ s }</em></p> ) }
            </div>
        );
    }
    else{
      return (
        <div>
            <h5 className="list-group-item-heading">{suggestion.companyName}</h5>
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

function mapDispatchToProps(dispatch, ownProps) {
    return {
        onSuggestionsUpdateRequested: ({value, force}) => {
            if(value !== ownProps.fields.input.value || force){
                !ownProps.onlyCompaniesOffice && dispatch(lookupOwnCompany(value));
                dispatch(lookupCompanyChange(value));
            }
        },
        onSelectOwnCompany: (id) => {
            dispatch(push("/company/view/"+ id));
        },
        onSelectCompany: (item) => {
            ownProps.onSelect ? ownProps.onSelect(item) : dispatch(push({pathname: `/import/${item.companyNumber}`,  query: item}));
        }
    };
}

function mapStateToProps(state) {
    return {lookupCompany: state.lookupCompany, lookupOwnCompany: state.lookupOwnCompany};
};


function renderLoading(){
    return <div><Loading/></div>
}

const theme = {
    container: 'auto-suggest',
    containerOpen: 'open',
    suggestionsContainer: 'suggest-container',
    input: 'form-control input-lg',
    sectionSuggestionsContainer: 'list-group',
    suggestion: 'list-group-item actionable',
    suggestionFocused: 'active'
};

const LOADING_DEFAULT =   [{title: 'Import From Companies Office', list: [{}]}];

export class SearchWidget extends React.Component {

    // add proptypes

    constructor() {
        super();
        this.handleSelect = ::this.handleSelect;
        this.state = {suggestions: []};
    }

    componentDidMount() {
        if(this.props.fields.input.initialValue){
            this.props.onSuggestionsUpdateRequested({value: this.props.fields.input.initialValue, force: true});
        }
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
        const loading = this.props.lookupCompany._status === 'fetching';

        if(this.props.lookupOwnCompany.list.length && !loading){
            suggestions.push({
                title: 'My Companies',
                list: this.props.lookupOwnCompany.list
            });
        }
        if(this.props.lookupCompany.list.length && !loading){
            suggestions.push({
                title: 'Import From Companies Office',
                list: this.props.lookupCompany.list.map(x => ({...x, companiesOffice: true}))
            });
        }
        if(this.props.lookupCompany._status === 'complete' &&
            suggestions.length === 0 && fields.input.value){
            noSuggestions = true;
        }


        const inputProps = {
            placeholder: this.props.placeholder || 'Type to find or import a company',
            value: fields.input.value || '',
            onChange: fields.input.onChange,
            autoFocus: !!fields.input.value
        };

        return (
            <div>
                <Autosuggest theme={theme}
                    multiSection={true}
                    suggestions={loading ? LOADING_DEFAULT : suggestions}
                    onSuggestionsFetchRequested={onSuggestionsUpdateRequested}
                    onSuggestionsClearRequested={() => {}}
                    onSuggestionSelected={loading ? null: this.handleSelect}
                    getSuggestionValue={getSuggestionValue}
                    getSectionSuggestions={ getSectionSuggestions }
                    renderSuggestion={loading ? renderLoading : renderSuggestion}
                    renderSectionTitle={ renderSectionTitle }
                    inputProps={inputProps} />
                { (noSuggestions && !loading) && <div className="no-suggestions">
                  No results found
                </div> }

            </div>
        );
    }
}



export const ConnectedPlaceholderSearch = reduxForm({
  form: 'searchForm',
  fields: ['input']
})(connect(mapStateToProps, mapDispatchToProps)(SearchWidget));
