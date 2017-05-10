"use strict";
import React, {PropTypes} from 'react';
import isoFetch from 'isomorphic-fetch';
import STRINGS from './strings'
import { Link } from 'react-router';
import moment from 'moment';
import { enums as TransactionTypes } from '../../config/enums/transactions';
import firstBy from 'thenby';

export function resourceIsForbidden(response){
    return response && response.status === 403;
}


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

export function getTotalShares(data){
    const shareClasses = {};
    data.actions.map(action => {
        if(!action.userSkip){
            const DIRECTIONS = {
                [TransactionTypes.ISSUE]: -1,
                [TransactionTypes.SUBDIVISION]: -1,
                [TransactionTypes.CONVERSION]: -1,
                [TransactionTypes.REDEMPTION]:-1,
                [TransactionTypes.ACQUISITION]: -1,
                [TransactionTypes.CONSOLIDATION]:-1,
                [TransactionTypes.CANCELLATION]:-1,
                [TransactionTypes.PURCHASE]: -1
            };

            (action.parcels || []).map(p => {
                shareClasses[p.shareClass] = shareClasses[p.shareClass] || 0;
                if(p.afterAmount !== undefined && p.beforeAmount !== undefined){
                    shareClasses[p.shareClass] += (DIRECTIONS[action.transactionType] || 1) * (p.afterAmount - p.beforeAmount);
                }
                else if(p.amount){
                    shareClasses[p.shareClass] += (DIRECTIONS[action.transactionType] || 1) *  p.amount;
                }
            });
        }
    });
    return Object.keys(shareClasses).reduce((sum, k) => sum + shareClasses[k], 0);
}


export function companyListToOptions(companies) {
    return [
        <option key={-1}></option>,
        ...(((companies || {}).data || []).map((c, i) =>
            <option value={c.id} key={i}>{c.currentCompanyState.companyName}</option>
    ))];
}

export function analyseCompany(company){
    // create a list of holders for a c
    company.currentCompanyState.holdingList = company.currentCompanyState.holdingList || {holdings: []};
    company.currentCompanyState.directorList = company.currentCompanyState.directorList || {directors: []};
    company.currentCompanyState.holders = company.currentCompanyState.holdingList.holdings.reduce((acc, holding) => {
        holding.holders.reduce((acc, holder) => {
            acc[holder.person.personId] = (acc[holder.person.personId] || []).concat([holding.holdingId]);
            return acc
        }, acc)
        return acc;
    }, {});
    company.currentCompanyState.holdingList.holdings.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    company.currentCompanyState.holdingList.holdings.map((holding) => {
        holding.holders.sort(firstBy(h => (h.data || {}).votingShareholder ? 1 : 0, -1))
    });
    return company;
}

export function fieldHelp(field, help){
    if(field.touched && field.error){
        return Array.isArray(field.error) ? field.error[0] : field.error;
    }
    if(help){
        return help;
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



export function formFieldProps(args = {}){
    return (component) => {
        component.prototype.formFieldProps = function(name, strings=STRINGS) {
            let field;
            if(Array.isArray(name)){
                field = name.reduce((acc, f) => acc[f], this.props.fields ? this.props.fields : this.props);
            }
            else{
                field = this.props.fields ? this.props.fields[name] : this.props[name];
            }
            return {
                 ...field,
                    bsStyle: fieldStyle(field),
                    label: strings[Array.isArray(name) ? name[name.length-1] : name] || name,
                    labelClassName: args.labelClassName,
                    wrapperClassName: args.wrapperClassName,
                    hasFeedback: true,
                    required: field.error && field.error.indexOf('Required') >= 0,
                    help: fieldHelp(field, strings[`${Array.isArray(name) ? name[name.length-1] : name}Help`])
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
    if(!x) {
        return '0';
    }
    const parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

export function stringDateToFormattedString(date){
    return moment(date).format('D MMM YYYY')
}


export function stringDateToFormattedStringTime(date){
    return moment(date).format('h:mma D MMM YYYY')
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

export function renderDocumentLinks(list, companyId){
    return list.filter(d => d.type !== 'Directory').map((d, i) =>
        <div key={i}><Link  activeClassName="active" className="nav-link" to={`/company/view/${companyId}/document/view/${d.id}`} >
            {d.filename}
        </Link></div>);
}


export function joinAnd(items=[], options={}){
    if(!items.length){
        return "UNKNOWN"
    }
    if(options.prop){
        if(items.length === 1){
            return (items[0] || {})[options.prop]
        }
        items = items.map(i => (i||{})[options.prop]);
    }
    else{
        if(items.length === 1){
            return items[0];
        }
    }
    return `${items.slice(0, items.length-1).join(', ')} and ${items[items.length-1]}`;
}

export function newHoldingString(newHolding){
    const names = joinAnd(newHolding.persons, {prop: 'name'});
    return 'New Shareholding: ' + (newHolding.holdingName ? newHolding.holdingName + ' - ' + names :  names);
}

export function personList(companyState, filter=() => true){
    const persons = companyState.holdingList.holdings.reduce((acc, h) => {
        return h.holders.filter(filter).reduce((acc, p) => {
            acc[p.person.personId] = {...p.person}
            return acc;
        }, acc);
    }, {});

    companyState.directorList.directors.reduce((acc, p) => {
        if(!acc[p.person.personId]){
            acc[p.person.personId] = {...p.person}
        }
        return acc;
    }, persons);

    const orderedPersons = Object.keys(persons).map(k => {
        return {id: k, ...persons[k]};
    })
    orderedPersons.sort((a, b) => a.name.localeCompare(b.name));
    return orderedPersons;
}

export function votingShareholderList(companyState) {
    return personList(companyState, (holder) => !holder.data || holder.data.votingShareholder);
}

export function personOptionsFromState(companyState, filter = x => true){
    return personList(companyState).filter(filter).map((p, i) => <option key={i} value={p.personId+''}>{p.name}</option>);
}

export const SHARE_CHANGE_TYPES = [
    TransactionTypes.ISSUE,
    TransactionTypes.CONVERSION,
    TransactionTypes.SUBDIVISION,
    TransactionTypes.REDEMPTION,
    TransactionTypes.ACQUISITION,
    TransactionTypes.CONSOLIDATION,
    TransactionTypes.CANCELLATION,
    TransactionTypes.PURCHASE
];

export const isAmendable = (action) => [TransactionTypes.AMEND, TransactionTypes.NEW_ALLOCATION].indexOf(action.transactionMethod || action.transactionType) > -1;

export const isShareChange = (action) => SHARE_CHANGE_TYPES.indexOf(action.transactionType) > -1;

export function collectAmendActions(actions){ return  actions.filter(isAmendable) };

export function collectShareChangeActions(actions){ return  actions.filter(isShareChange) };

export const actionOptionsFromActionSets = (actionSets=[], shareClassMap, ignoreId) => {
    function renderParcels(action, shareClassMap){
        return `${action.parcels.map(p => `${action.inferAmount ? 'All' : numberWithCommas(p.amount)} ${renderShareClass(p.shareClass,  shareClassMap)}`).join(', ') } shares`;
    }
    return <optgroup label="Reported Shareholding Changes"  key="reported-changes">{
        actionSets.reduce((acc, actionSet) => {
            if(ignoreId && actionSet.id === ignoreId){
                return acc;
            }
            collectAmendActions(actionSet.data.actions).reduce((acc, action) => {
                acc.push(<option key={action.id} value={action.id}>{stringDateToFormattedString(actionSet.data.effectiveDate)} - { joinAnd((action.holders || action.afterHolders), {prop: 'name'}) } - { renderParcels(action, shareClassMap) } </option>);
                return acc;
            }, acc)
            return acc;
    }, []) }
    </optgroup>
}

export  function holdingOptionsFromState(companyState) {
    return companyState.holdingList.holdings.map((h, i) => {
            return <option key={i} value={h.holdingId}>{h.name && h.name+': ' } { joinAnd(h.holders.map(h => h.person), {prop: 'name'}) }</option>
        });
}

export function holdingsAndHolders(companyState) {
    return companyState.holdingList.holdings.map((holding) => {
        const people = holding.holders.map((holder) => ({
            personId: holder.person.personId,
            name: holder.person.name,
            address: holder.person.address,
            attr: holder.person.attr
        }));
        return {
            name: joinAnd(people, {prop: 'name'}),
            holders: people,
            holdingId: holding.holdingId.toString()
        };
    });
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
                if(p.person.personId === id){
                    result = {name: p.person.name, address: p.person.address, personId: p.person.personId, companyNumber: p.person.companyNumber};
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

export function personMap(companyState){
    // dumb
    const result = {};
    companyState.holdingList.holdings.map((h) => {
        h.holders.map((p) => {
            result[p.person.personId] = {name: p.person.name, address: p.person.address, personId: p.person.personId, companyNumber: p.person.companyNumber, attr: p.person.attr};
        });
    });
    companyState.directorList.directors.map((p) => {
        result[p.person.personId] = {name: p.person.name, address: p.person.address, personId: p.person.personId, companyNumber: p.person.companyNumber, attr: p.person.attr};
    });
    return result;
}


export function isNaturalPerson(person){
    let nonNatural = !!person.companyNumber;
    nonNatural = nonNatural || (person.attr || {}).isNaturalPerson === false;
    return !nonNatural;
}

export function personAttributes(person){
    return {name: person.name, address: person.address, personId: person.personId, companyNumber: person.companyNumber};
}

export function generateShareClassMap(companyState){
    if(companyState && companyState.shareClasses && companyState.shareClasses.shareClasses){
        const results = companyState.shareClasses.shareClasses.reduce((acc, s) => {
            acc[s.id] = s;
            return acc;
        }, {});
        if(companyState.shareClasses.shareClasses.length === 1){
            results[undefined] = companyState.shareClasses.shareClasses[0];
        }
        return results;
    }

    return {};
}


export function renderShareClass(shareClass, shareClassMap = {}){
    const result = shareClassMap[shareClass] ? shareClassMap[shareClass].name : STRINGS.defaultShareClass;
    return result;
}


export function formatString(formatted) {
    for (var i = 1; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+(i-1)+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};


export function sortAlerts(response) {
    const data = (response || [])
    data.sort((a, b) => {
        return ((a.deadlines || {}).overdue ? 1 : -1) - ((b.deadlines || {}).overdue ? 1 : -1)
    });
    const companyMap = (data || []).reduce((acc, entry) => {
        acc[entry.id] = entry;
        return acc;
    }, {});
    const dateMap = (data || []).reduce((acc, entry) => {
        if(entry.deadlines){
            Object.keys(entry.deadlines).map(k => {
                const deadline = entry.deadlines[k];
                if(deadline){
                    const due = moment(deadline.dueDate).format('YYYY-MM-DD');
                    acc[due] = acc[due] || [];
                    acc[due].push({id: entry.id, companyName: entry.companyName, deadlines: {[k]: deadline}})
                }
            })
        }
        (entry.futureTransactions || []).map(transaction => {
            const due = moment(transaction.effectiveDate).format('YYYY-MM-DD');
            acc[due] = acc[due] || [];
            acc[due].push({id: entry.id, companyName: entry.companyName, transaction: transaction})

            if(transaction.subTransactions[0].data.noticeDate){
                const noticeDue = moment(transaction.subTransactions[0].data.noticeDate).format('YYYY-MM-DD');
                acc[noticeDue] = acc[noticeDue] || [];
                acc[noticeDue].push({id: entry.id, companyName: entry.companyName, noticeDate: true, transaction: transaction})
            }
        })

        return acc;
    }, {});
    return {alertList: data, companyMap, dateMap}
}

export const processEvents = (events) => {
    const eventMap = events.reduce((acc, event) => {
        const str = moment(event.date).format('YYYY-MM-DD');
        acc[str] = acc[str] || []
        acc[str].push(event);
        return acc;
    }, {})
    return {eventList: events, eventMap: eventMap}
}
