"use strict";
// api/services/scrapingService.js
// es7
const _ = require('lodash');
const cheerio = require('cheerio');
const Promise = require("bluebird");
const fetch = require("isomorphic-fetch");
const fs = Promise.promisifyAll(require("fs"));
const moment = require('moment');
const querystring = require('querystring');


const DOCUMENT_TYPES = {
    UPDATE : 'UPDATE',
    ISSUE: 'ISSUE',
    PURCHASE: 'PURCHASE',
    PARTICULARS: 'PARTICULARS',
    NAME_CHANGE: 'NAME_CHANGE',
    ANNUAL_RETURN: 'ANNUAL_RETURN',
    ADDRESS_CHANGE: 'ADDRESS_CHANGE',
    INCORPORATION: 'INCORPORATION',
    PARTICULARS_OF_DIRECTOR: 'PARTICULARS_OF_DIRECTOR',
    UNKNOWN: 'UNKNOWN',
};

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    var error = new Error(response.statusText)
    error.response = response
    throw error
  }
}

const toInt = function (value) {
    value = value.replace(/,/g, '');
    if(/^(\-|\+)?([0-9]+|Infinity)$/.test(value))
        return Number(value);
    return NaN;
}

function cleanString(str){
    return _.trim(str).replace(/[\n\r]/g, '').replace(/\s\s+/g, ' ').replace(/\s,/g, ',').replace(/,$/, '')
}

function invertName(str){
   const match = /([^,]*), (.*)/.exec(str);
    if(match){
        return `${match[2]} ${match[1]}`;
    }
    return str;

}

function chunkBy(array, func, include){
    const result = _.reduce(array, (acc, el, i) => {
        if(func(el, i)){
            if(include)
                acc.push([el]);
            else
                acc.push([]);
        }
        else{
            _.last(acc).push(el);
        }
        return acc;
    }, [[]]);

    while(result.length && !_.last(result).length){
         result.pop();
    }
    return result;
}


function parseName(text){
    text = cleanString(text);
    let companyNumberRegex = /^\s*(.*)\( ([0-9]{4,}) \)\s*$/g,
        matches = companyNumberRegex.exec(text);
    return {
        companyNumber: matches ? matches[2] : null,
        name: matches ? matches[1] : text
    }
}

function textAfterMatch($, query, regex){
        try{
            return cleanString($(query).filter(function(){
                return $(this).text().match(regex);
            })[0].parentNode.lastChild.data)
        }catch(e){};
}

function divAfterMatch($, query, regex){
        try{
            return cleanString($(query).filter(function(){
                return $(this).text().match(regex);
            }).first().next().text())
        }catch(e){};
}

function divAfterParent($, query, regex){
        try{
            return cleanString($(query).filter(function(){
                return $(this).text().match(regex);
            }).first().parent().next().text())
        }catch(e){};
}

function parseIssue($, dateRegexP = 'Date of Issue:'){
    let fields = [
        ['beforeAmount', 'Previous Number of Shares:', Number],
        ['byAmount', 'Increased Shares by:', Number],
        ['afterAmount', 'New Number of Shares:', Number],
        ['amount', 'Number of Increased Shares:', Number],
        ['effectiveDate', dateRegexP, date => moment(date, 'DD MMM YYYY').toDate()]
    ];
    return fields.reduce(function(result, f){
        result[f[0]] = f[2](divAfterMatch($, '.row .wideLabel', new RegExp('^\\s*'+f[1]+'\\s*$')));
        return result;
    }, {increase: true})
}

function parseAcquisition($, dateRegexP = 'Date of Acquistion:'){
    let fields = [
        ['beforeAmount', 'Previous Number of Shares:', Number],
        ['byAmount', 'Decreased Shares by:', Number],
        ['afterAmount', 'New Number of Shares:', Number],
        ['amount', 'Number of Decreased Shares:', Number],
        ['effectiveDate', dateRegexP, date => moment(date, 'DD MMM YYYY').toDate()]
    ];
    return fields.reduce(function(result, f){
        result[f[0]] = f[2](divAfterMatch($, '.row .wideLabel', new RegExp('^\\s*'+f[1]+'\\s*$')));
        return result;
    }, {increase: false})
}


function parseAmendAllocation($, $el){
   const result =  {
        beforeAmount: Number(cleanString($el.find('.beforePanel .before.value.shareNumber').text().replace(' Shares', ''))),
        beforeHolders: $el.find('.beforePanel .value.shareholderName').map(function(){
            return {...parseName($(this).text()), address: cleanString($(this).parent().next().text())};
        }).get(),
        afterAmount: Number(cleanString($el.find('.afterPanel .value.shareNumber').text().replace(' Shares', ''))),
        afterHolders: $el.find('.afterPanel .value.shareholderName').map(function(){
            return {...parseName($(this).text()), address: cleanString($(this).parent().next().text())};
        }).get(),
        transactionType: Transaction.types.AMEND
    }
    // if the holdings change, we must wait and prompt user to figure out order
    if(!result.beforeAmount && !result.afterAmount ){
        result.transactionType = Transaction.types.HOLDING_TRANSFER;
        result.unknownAmount = true;
    }

    if(JSON.stringify(result.beforeHolders) !== JSON.stringify(result.afterHolders)){
        // if the names are different, then it is a transfer
        // if they are the same, then make after addresses the before addresses
        const sameNames = result.beforeHolders.map(b => b.name).join('|') === result.afterHolders.map(b => b.name).join('|');
        if(sameNames){
            result.afterHolders = result.beforeHolders;
        }
        else{
            result.transactionType = Transaction.types.HOLDING_TRANSFER;
        }
    }

    result.amount = Math.abs(result.beforeAmount - result.afterAmount)
    return result;
}

function parseAmendHolder($, $el){
   const result =  {
        beforeHolder: $el.find('.beforePanel .value.shareholderName').map(function(){
            return {...parseName($(this).text()), address: cleanString($(this).parent().next().text())};
        }).get()[0],
        afterHolder: $el.find('.afterPanel .value.shareholderName').map(function(){
            return {...parseName($(this).text()), address: cleanString($(this).parent().next().text())};
        }).get()[0],
    }
    return result;
}

function parseAllocation($, $el){
   return {
        amount:  Number(cleanString($el.find('.value.shareNumber').text().replace(' Shares', ''))),
        holders: $el.find('.value.shareholderName').map(function(){
            return {...parseName($(this).text()), address: cleanString($(this).parent().next().text())};
        }).get()
    }
}



function parseHolder($, $el){
   return {
        holders: $el.find('.value.shareholderName').map(function(){
            return {
                ...parseName($(this).text()),
                address: cleanString($(this).parent().next().text())};
        }).get()
    }
}


const EXTRACT_DOCUMENT_MAP = {
    [DOCUMENT_TYPES.UPDATE]: ($) => {
        let transactionMap = {
            'Issue': Transaction.types.ISSUE,
            'Conversion/Subdivision of Shares': Transaction.types.CONVERSION,
            'Acquisition': Transaction.types.ACQUISITION,
            'Purchase': Transaction.types.PURCHASE,
            'Consolidation': Transaction.types.CONSOLIDATION,
            'Redemption': Transaction.types.REDEMPTION,
        }
        let result = {};
        let regex = /^\s*Type of Change:\s*$/;
        result.originaltransactionType = divAfterParent($, '.row .wideLabel label', regex);
        result.transactionType = transactionMap[result.originaltransactionType];
        result.effectiveDate = result.registrationDate = moment($('.row.wideLabel label').filter(function(){
                    return $(this).text().match(/Registration Date and Time/);
                })[0].nextSibling.nodeValue, 'DD MMM YYYY HH:mm:ss').toDate()
        switch(result.transactionType){
            case(Transaction.types.ISSUE):
                result = {...result, ...parseIssue($)}
                break;
            case(Transaction.types.CONVERSION):
                result = {...result, ...parseIssue($, 'Date of Conversion/Subdivision:')}
                break;
            case(Transaction.types.ACQUISITION):
                result = {...result, ...parseAcquisition($)}
                break;
            case(Transaction.types.REDEMPTION):
                result = {...result, ...parseAcquisition($, 'Date of Redemption:')}
                break;
            case(Transaction.types.CANCELLATION):
                result = {...result, ...parseAcquisition($, 'Date of Cancellation:')}
                break;
            case(Transaction.types.PURCHASE):
                result = {...result, ...parseAcquisition($, 'Date of Purchase:')}
                break;
            case(Transaction.types.CONSOLIDATION):
                result = {...result, ...parseAcquisition($, 'Date of Consolidation:')}
                break;
            default:
        }
        return {actions: [{...result, effectiveDate: result.registrationDate}], totalShares: result.increase ? -result.amount : result.amount, effectiveDate: result.registrationDate };
    },

    [DOCUMENT_TYPES.PARTICULARS]: ($) => {
        let result = {};
        result.effectiveDate = result.registrationDate = moment($('.row.wideLabel label').filter(function(){
                    return $(this).text().match(/Registration Date and Time/);
                })[0].nextSibling.nodeValue, 'DD MMM YYYY HH:mm:ss').toDate();

        result.actions = $('#reviewContactChangesContent .panel').map(function(){
            let $el = $(this);
            let amendAllocRegex = /^\s*Amended Share Allocation\s*$/;
            let amendHolderRegex = /^\s*Amended Shareholder\s*$/;
            let newAllocRegex = /^\s*New Share Allocation\s*$/;
            let removedAllocRegex = /^\s*Removed Share Allocation\s*$/;
            let newHolderRegex = /^\s*New Shareholder\s*$/;
            let removedHolderRegex = /^\s*Removed Shareholder\s*$/;
            let head = cleanString($el.find('.head').text());
            if(head.match(amendAllocRegex)){
                return parseAmendAllocation($, $el);
            }
            else if(head.match(amendHolderRegex)){
                return {...parseAmendHolder($, $el), transactionType: Transaction.types.HOLDER_CHANGE};
            }
            else if(head.match(newAllocRegex)){
                let data = parseAllocation($, $el)
                return {...data, transactionType: Transaction.types.NEW_ALLOCATION, beforeAmount: 0, afterAmount: data.amount};
            }
            else if(head.match(removedAllocRegex)){
                let data = parseAllocation($, $el)
                return {...data, transactionType: Transaction.types.REMOVE_ALLOCATION, beforeAmount: data.amount, afterAmount: 0};
            }
            else if(head.match(newHolderRegex)){
                return parseHolder($, $el);
            }
            else if(head.match(removedHolderRegex)){
                return parseHolder($, $el);
            }

        }).get();


       result.totalShares = result.actions.reduce((acc, action) => {
            switch(action.transactionType){
                case Transaction.types.AMEND:
                    return acc + (action.afterAmount - action.beforeAmount)
                case Transaction.types.NEW_ALLOCATION:
                    return acc + action.amount;
                case Transaction.types.REMOVE_ALLOCATION:
                    return acc - action.amount;
                 case Transaction.types.HOLDING_TRANSFER:
                    if(action.amount){
                        return acc + (action.afterAmount - action.beforeAmount)
                    }
                default:
                    return acc;
            }
        }, 0);

        // a kludge to add companyNumbers from new/removeHolder to new/remove allocation
        let idMap = result.actions.reduce(function(acc, action){
            _.each(action.holders, function(holder){
                if(holder.companyNumber){
                    acc[holder.name] = holder.companyNumber;
                }
            });
            return acc;
        }, {});
        function addCompanyNumber(holder){
            if(idMap[holder.name]){
                holder.companyNumber = idMap[holder.name];
            }
        }
        result.actions.map(function(a){

            _.each(a.holders, addCompanyNumber);
            _.each(a.afterHolders, addCompanyNumber);
            _.each(a.beforeHolders, addCompanyNumber);
            a.effectiveDate = result.effectiveDate;
        });
        return result;
    },
    [DOCUMENT_TYPES.NAME_CHANGE]: ($) => {
        try{
            return {actions: [{
                transactionType: Transaction.types.NAME_CHANGE,
                newCompanyName: cleanString($('.row.wideLabel label').filter(function(){
                        return $(this).text().match(/New Company Name/);
                    })[0].nextSibling.nodeValue),
                previousCompanyName: cleanString($('.row.wideLabel label').filter(function(){
                        return $(this).text().match(/Previous Company Name/);
                    })[0].nextSibling.nodeValue),
                effectiveDate:  moment($('.row.wideLabel label').filter(function(){
                        return $(this).text().match(/Effective Date/);
                    })[0].nextSibling.nodeValue, 'DD MMM YYYY HH:mm').toDate(),
            }]}
        }catch(e){
            return {}
        }
    },

    [DOCUMENT_TYPES.ADDRESS_CHANGE]: ($) => {
        const HEADING_MAP = {
            'Updated Registered Office Address' : 'registeredCompanyAddress',
            'Removed Registered Office Address' : 'registeredCompanyAddress',
            'New Registered Office Address' : 'registeredCompanyAddress',

            'Updated Address For Service': 'addressForService',
            'Removed Address For Service': 'addressForService',
            'New Address For Service': 'addressForService',

            'Updated Address For Share Register': 'addressForShareRegister',
            'Removed Address For Share Register': 'addressForShareRegister',
            'New Address For Share Register': 'addressForShareRegister'
        }

        return {actions: $('#reviewContactChangesContent .panel').map((i, el)=>{
            // all records, ignore for now
            if($(el).find('.head').text().indexOf('Address For Records') > -1){
                return false;
            }
            // update
            if($(el).find('.afterPanel .row').length){
                return {
                    transactionType: Transaction.types.ADDRESS_CHANGE,
                    previousAddress: cleanString($(el).find('.beforePanel .row').eq(1).text()),
                    newAddress: cleanString($(el).find('.afterPanel .row').eq(1).text()),
                    effectiveDate: moment(cleanString($(el).find('.afterPanel .row').eq(2).text()), 'DD MMM YYYY').toDate(),
                    field: HEADING_MAP[cleanString($(el).find('.head').text())]
                }
            }
            // Removed
            if($(el).find('.head').text().indexOf('Removed') === 0){
                return {
                    transactionType: Transaction.types.ADDRESS_CHANGE,
                    previousAddress: cleanString($(el).find('.row').eq(0).text()),
                    newAddress: null,
                    effectiveDate: moment(cleanString($(el).find('.row').eq(1).text()), 'DD MMM YYYY').toDate(),
                    field: HEADING_MAP[cleanString($(el).find('.head').text())]
                }
            }
            // New
            return {
                transactionType: Transaction.types.ADDRESS_CHANGE,
                previousAddress: null,
                newAddress: cleanString($(el).find('.row').eq(0).text()),
                effectiveDate: moment(cleanString($(el).find('.row').eq(1).text()), 'DD MMM YYYY').toDate(),
                field: HEADING_MAP[cleanString($(el).find('.head').text())]
            }
        }).get().filter(action => !!action).reverse()};
        // reverse because of cases like http://www.business.govt.nz/companies/app/ui/pages/companies/135116/20683278/entityFilingRequirement
    },

    [DOCUMENT_TYPES.PARTICULARS_OF_DIRECTOR]: ($) => {
        const transactionType = ($el) => {
            if($el.is('#amendmentConfirm')){
                return Transaction.types.UPDATE_DIRECTOR;
            }
            else if($el.is('#ceaseConfirm')){
                return Transaction.types.REMOVE_DIRECTOR;
            }
            return Transaction.types.NEW_DIRECTOR;
        }
        const results = {actions: [
            ...$('#amendmentConfirm').map((i, el)=>{
            return {
                transactionType: transactionType($(el)),
                beforeName: cleanString($(el).find('.before .directorName').text()),
                beforeAddress: cleanString($(el).find('.before .directorAddress').text()),
                afterName: cleanString($(el).find('.after .directorName').text()),
                afterAddress: cleanString($(el).find('.after .directorAddress').text())
            }}).get(),
            ...$('#ceaseConfirm, #pendingConfirm').map((i, el)=>{
            return {
                transactionType: transactionType($(el)),
                name: cleanString($(el).find('.directorName').text()),
                address: cleanString($(el).find('.directorAddress').text()),
                effectiveDate: moment(cleanString(cleanString($(el).find('.directorAppointmentDate, .directorCeasedDate').text())), 'DD/MM/YYYY'),
            }}).get()
            ]};
        // Currently ignoring new and remove, and instead using the directorship history
        if(results.actions.length && results.actions[0].effectiveDate){
            results.effectiveDate = results.actions[0].effectiveDate;
        }
        return results;
    },

    [DOCUMENT_TYPES.INCORPORATION]: ($) => {
        const match = (match) => {
            try{
                return cleanString($('.row.wideLabel label').filter(function(){
                        return $(this).text().match(match);
                    })[0].nextSibling.nodeValue)
            }catch(e){
                return null;
            }
        }

        const matchMultline = (match) => {
            try{
                let el = $('.row.wideLabel').filter(function(){
                        return $(this).find('label').text().match(match);
                    });
                const parts = [el];
                while(el.next().find('label').length && !cleanString(el.next().find('label').text())){
                    el = el.next();
                    parts.push(el);
                }
                const text = parts.map(p => {
                    return cleanString(p.find('label')[0].nextSibling.nodeValue);
                });
                return text;
            }catch(e){
                return [];
            }
        }

        const date = moment(match(/Incorporated/), 'DD MMM YYYY').toDate();
        const result = {
            transactionType: Transaction.types.INCORPORATION,
            effectiveDate: date,
            actions: [{
                fields:{
                    companyNumber: match(/Company number/),
                    companyName: match(/Company name/),
                    incorporationDate: date,
                    companyStatus:  match(/Company Status/),
                    constiutionFiled: match(/Constitution filed/),
                    arFilingMonth: match(/Annual return filing month/),
                    ultimateHoldingCompany: cleanString($('.row.wideLabel h2').filter(function(){
                        return $(this).text().match(/Ultimate Holding Company/);
                    })[0].nextSibling.nodeValue) !== 'Yes',
                    registeredCompanyAddress:  matchMultline(/Registered office address/).join(', ') || null,
                    addressForShareRegister:  matchMultline(/Address for share register/).join(', ')|| null,
                    addressForService:  matchMultline(/Address for service/).join(', ') || null
                },
                transactionType: Transaction.types.DETAILS_MASS,
            }],
            totalShares: 0
        }
        const holdings = matchMultline(/Total Number of Company Shares/);

        if(holdings.length){
            const total = toInt(holdings[0]);
            result.actions.push({
                beforeAmount: 0,
                afterAmount: total,
                byAmount: total,
                amount: total,
                transactionType: Transaction.types.ISSUE
            });

            // get array of all integers
            const ints = holdings.slice(1)
                .map((value) => toInt(value))
                .filter((value) => value);

            // get numbers which comprise sum
            const subset = UtilService.subsetSum(ints, total).vals;

            const chunks = chunkBy(holdings.slice(1), (value, i) => {
                const intValue = toInt(value);
                if(i && intValue && subset.indexOf(intValue) > -1){
                    subset.splice(subset.indexOf(intValue), 1);
                    return true;
                }
            }, true);

            const getHolders = (rows) => {
                const results = [];
                let i = 0;
                while(i < rows.length){
                    const holder = {};
                    if(toInt(rows[i])){
                        holder.companyNumber = rows[i];
                        i++;
                    }
                    holder.name = invertName(rows[i])
                    holder.address = rows[i+1];
                    i += 2;
                    results.push(holder);
                }
                return results;

            }
            chunks.map(chunk => {
                result.actions.push({
                    transactionMethod: Transaction.types.NEW_ALLOCATION,
                    transactionType: Transaction.types.ISSUE_TO,
                    amount: toInt(chunk[0]),
                    beforeAmount: 0,
                    afterAmount: toInt(chunk[0]),
                    holders: getHolders(chunk.slice(1)),
                    confirmationUnneeded: true
                })
            })
        }

        const directors = chunkBy($('h2').filter(function(){
                return $(this).text().match(/Directors/)
            })
            .nextUntil('hr')
            .map((i, d) => {
                return cleanString($(d).text());
            })
            .get(), (d) => {
                return !d
            })
            .map(d => {
                result.actions.push({
                    transactionType: Transaction.types.NEW_DIRECTOR,
                    name: invertName(d[0]),
                    address: d[1]
                })
            })
        return result;
    },

    [DOCUMENT_TYPES.ANNUAL_RETURN]: ($) => {
        // This isn't really a transaction at the moment, but used for validation
        const effectiveDate = moment($('.row.wideLabel label').filter(function(){
                    return $(this).text().match(/Registration Date and Time/);
                })[0].nextSibling.nodeValue, 'DD MMM YYYY HH:mm:ss').toDate();
        return {actions: [{
            transactionType: Transaction.types.ANNUAL_RETURN,

            registeredCompanyAddress:  cleanString($('label[for="registeredAddress"]').next().text()),

            addressForService:  cleanString($('label[for="addressForService"]').next().text()),

            directors: chunkBy($('h3 span').filter(function(){
                            return $(this).text().match(/Directors/);
                        })
                        .first()
                        .parent()
                        .nextUntil('.clear'), (el)=>$(el).is('hr')
                        )
                    .map(function(chunk){
                    return {
                        name: cleanString($(chunk[0]).find('label[for="fullName"]')[0].parentNode.lastChild.data),
                        address: cleanString($(chunk[1]).find('.addressLine').text()),
                        appointment: moment(cleanString(
                            $(chunk[2]).find('label[for="appointmentDate"]')[0].parentNode.lastChild.data),
                        'DD MMM YYYY').toDate()
                    };
                }),

            totalShares: toInt($('span.h3').filter(function(){
                            return $(this).text().match(/Total Number of Shares:/);
                        }).first().next().text()),

            holdings: chunkBy($('span').filter(function(){
                            return $(this).text().match(/Shareholders in Allocation/);
                        })
                            .first()
                            .parent()
                            .nextUntil('.clear'), (el)=>$(el).is('hr')
                        )
                        .map((chunk) => {
                            return {
                            parcels: [{amount: toInt($(chunk[0]).find('label').text().replace(' Shares', ''))}],
                            holders: _.chunk(chunk, 2).map(holder => ({
                                    name: cleanString($(holder[0]).find('strong').text()),
                                    address: cleanString($(holder[1]).find('.addressLine').text())
                                }))
                            }
                        }),

            effectiveDate:  effectiveDate,
        }],
        effectiveDate: effectiveDate,
        transactionType: Transaction.types.ANNUAL_RETURN
        }
    },
    [DOCUMENT_TYPES.ISSUE]: ($) => {
        const result = {};
        result.transactionType = Transaction.types.ISSUE;
        result.registrationDate = moment($('.row.wideLabel label').filter(function(){
                    return $(this).text().match(/Registration Date and Time/);
                })[0].nextSibling.nodeValue, 'DD MMM YYYY HH:mm:ss').toDate()
        result.unknownAmount = true;
        result.effectiveDate = result.registrationDate;
        return {actions: [result], effectiveDate: result.effectiveDate }
    }
}

function nextUntil(node, has) {
    const results = [];
    while(node.length && !node.find(has).length){
        let str = cleanString(node.text());
        if(str){
            results.push(str);
        }
        node =  node.next();
    }
    return results;
}

function *nextUntilChunks($, node, has, sel) {
    while(node.length){
        let results = [];
        while(node.length && !node.find(has).length){
            results = results.concat(node.find(sel).map((i, e) => cleanString($(e).text())).get());
            node =  node.next();
        }
        if(results.length){
            yield results;
        }
        node = node.next();
    }
}

const match = ($, match) => {
    return $('table td font').filter(function(){
        return $(this).text().match(match);
    });
}


const EXTRACT_BIZ_DOCUMENT_MAP= {
       [DOCUMENT_TYPES.INCORPORATION]: ($) => {


        const heading = $('table table').eq(2);
        const title = heading.find('td').first().find('font b').text();

        const matches = /^(\d+)\S+(.+)$/.exec(title);
        if(!matches){
            //then old style doc,
            return {}
        }
        const companyNumber = matches[1];
        const companyName = cleanString(matches[2]);
        const date = moment(cleanString(match($, 'Registration Date:').parent().text().replace('Registration Date:', '')), 'DD MMM YYYY').toDate();

        const registeredCompanyAddressNode = match($, 'Registered Office').closest('tr').next();
        const registeredCompanyAddress = nextUntil(registeredCompanyAddressNode, 'img').join(', ');
        const addressForShareRegisterNode = match($, 'Address for Share Register').closest('tr').next();
        const addressForShareRegister = nextUntil(addressForShareRegisterNode, 'img').join(', ');
        const addressForServiceNode = match($, 'Address for Service').closest('tr').next();
        const addressForService = nextUntil(addressForServiceNode, 'img').join(', ');
        const addressForCommunicationNode = match($, 'Address for Communication').closest('tr').next();
        const addressForCommunication = nextUntil(addressForCommunicationNode, 'img').join(', ');
        const result = {
            transactionType: Transaction.types.INCORPORATION,
            effectiveDate: date,
            totalShares: 0,
            actions: [{
                fields:{
                    companyNumber: companyNumber,
                    companyName: companyName,
                    incorporationDate: date,
                    registeredCompanyAddress:  registeredCompanyAddress || null,
                    addressForShareRegister:  addressForShareRegister || null,
                    addressForService:  addressForService || null,
                    addressForCommunication: addressForCommunication || null,
                },
                transactionType: Transaction.types.DETAILS_MASS
            }]
        }

        const issue = match($, 'Total Company Shares').closest('td');
        const total = toInt(cleanString(issue.next().find('font').text().replace(',','')));
        const holdings = issue.closest('table').next('table');
        const chunks = Array.from(nextUntilChunks($, holdings.find('tr').first(), 'img[height=5]', 'td'))
            .map(chunk => {
                return chunk.filter(c => c);
            });

        const getHolders = (rows) => {
            const results = [];
            let i = 0;
            while(i < rows.length){
                const holder = {};
                const company = /^(\d+) (.+)$/.exec(rows[i]);
                if(company){
                    holder.companyNumber= company[1]
                    holder.name = company[2];
                }
                else{
                    holder.name = invertName(rows[i]);
                }
                holder.address = rows[i+1];
                i += 2;
                results.push(holder);
            }
            return results;
        }

        const issueAction = {
            beforeAmount: 0,
            afterAmount: total,
            byAmount: total,
            amount: total,
            transactionType: Transaction.types.ISSUE
        };

        result.actions.push(issueAction);
        let issuedTotal = 0;
        chunks.map(chunk => {
            if(chunk.length){
                result.actions.push({
                    transactionMethod: Transaction.types.NEW_ALLOCATION,
                    transactionType: Transaction.types.ISSUE_TO,
                    amount: toInt(chunk[0]),
                    beforeAmount: 0,
                    afterAmount: toInt(chunk[0]),
                    holders: getHolders(chunk.slice(1)),
                    confirmationUnneeded: true
                });
                issuedTotal += toInt(chunk[0]);
            }
        });

        // See bad total http://www.companiesoffice.govt.nz/companies/app/ui/pages/companies/1760468/2646112/entityFilingRequirement
        if(issuedTotal > issueAction.amount){
            issueAction.afterAmount = issueAction.byAmount = issueAction.amount = issuedTotal;
        }


        const directorsTable =  match($, /2. Directors$/g).closest('table').closest('tr').next();

        const directors = _.chunk(directorsTable.find('td')
            .map((i, el) => cleanString($(el).text())).get().filter(e => e), 2);

        directors.map(d => {
            result.actions.push({
                transactionType: Transaction.types.NEW_DIRECTOR,
                name: invertName(d[0]),
                address: d[1]
            })
        });
        return result;
    },

    [DOCUMENT_TYPES.ANNUAL_RETURN]: ($) => {
        // This isn't really a transaction at the moment, but used for validation
        const date = cleanString(match($, 'Registration Date:').parent().text().replace('Registration Date:', ''));
        const time = cleanString(match($, 'Time:').parent().text().replace('Time:', ''));

        const effectiveDate = moment(`${date} ${time}`, 'DD MMM YYYY HH:mm:ss').toDate();

        const registeredCompanyAddressNode = match($, 'Registered Office').closest('tr').next();
        const registeredCompanyAddress = nextUntil(registeredCompanyAddressNode, 'img').join(', ');
        const addressForShareRegisterNode = match($, 'Address for Share Register').closest('tr').next();
        const addressForShareRegister = nextUntil(addressForShareRegisterNode, 'img').join(', ');
        const addressForServiceNode = match($, 'Address for Service').closest('tr').next();
        const addressForService = nextUntil(addressForServiceNode, 'img').join(', ');
        const addressForCommunicationNode = match($, 'Address for Communication').closest('tr').next();
        const addressForCommunication = nextUntil(addressForCommunicationNode, 'img').join(', ');
        const directorTable = match($, 'Directors').parentsUntil('tr').parentsUntil('tr').next('tr').next('tr').find('table');


        const directorChunks = Array.from(nextUntilChunks($, directorTable.find('tr').first(), 'img[height=15]', 'td'))
            .map(chunk => {
                return chunk.filter(c => c);
            });

        const directors = directorChunks.map(d => {
            return {
                name: invertName(d[0]),
                address: d[1]
            }
        });

        const holdingTable = match($, 'Share Parcels').parentsUntil('tr').parentsUntil('tr').next('tr').find('table');

        const holdingChunks = Array.from(nextUntilChunks($, holdingTable.find('tr').first(), 'img[height=10]', 'td'))
            .map(chunk => {
                return chunk.filter(c => c);
            });

        let totalShares = 0;
        const holdings = holdingChunks.map(h => {
            const holders  = _.chunk(h.slice(3), 2).map(h => {
                let name = invertName(h[0]);
                let companyNumber;
                if(h[0].match(/^([\d+]{3,})/)){
                    companyNumber = h[0].match(/^([\d+]{3,})/)[1];
                    name = cleanString(h[0].replace(companyNumber, ''))
                }
                return {
                    name,
                    address: h[1],
                    companyNumber
                }
            })
            let amount= toInt(h[1]);
            totalShares += amount;
            return {
                parcels: [{amount: amount }],
                holders: holders
            }
        });

        if(!holdings.length){
            return {};
        }

        return {actions: [{
            transactionType: Transaction.types.ANNUAL_RETURN,
            registeredCompanyAddress,
            addressForShareRegister,
            addressForService,
            addressForCommunication,
            directors,
            totalShares,
            holdings,
            effectiveDate,
        }],
        effectiveDate: effectiveDate,
        transactionType: Transaction.types.ANNUAL_RETURN
        }
    },

    [DOCUMENT_TYPES.PARTICULARS]: ($) => {
        const result = {};
        let remaining, chunks, type;

        let start = $('font').filter(function(){
            return $(this).text().match("Summary of Share Parcel Changes");
        }).parent().parent().next();

        if(!start.length){
            // document looks like http://www.companiesoffice.govt.nz/companies/app/ui/pages/companies/422184/13077447/entityFilingRequirement
            start = $('font').filter(function(){
                return $(this).text().match("Summary of Share Parcel Changes");
            }).parents('tr').parents('tr').next().find('tr');
            remaining = start.nextAll();

            chunks = chunkBy(remaining.toArray(), (el) => {
               return $(el).find('img').length || $(el).find('tr:empty').length;
            }).filter(f => f.length);

            result.actions = chunks.reduce(function(acc, segment, j){
                let amendAllocRegex = /^\s*Amended Share Parcel\(s\)\s*$/;
                let newAllocRegex = /^\s*New Share Parcel\(s\)\s*$/;
                let deletedAllocRegex = /^\s*Deleted Share Parcel\(s\)\s*$/;
                let index = 0
                let head = $(segment[index]).text();
                if(head.match(amendAllocRegex)){
                    type = Transaction.types.AMEND;
                    index++;
                }
                else if(head.match(newAllocRegex)){
                    type = Transaction.types.NEW_ALLOCATION;
                    index++;
                }
                else if(head.match(deletedAllocRegex)){
                    type = Transaction.types.REMOVE_ALLOCATION;
                    index++;
                }

                if(type === Transaction.types.AMEND){
                    let result = {beforeHolders: [], afterHolders: [],  transactionType: type};
                    const diff = cleanString($(segment[index++]).find('td').eq(1).text());
                    const parts = diff.split(' was ');
                    if(parts.length === 2){
                        result.afterAmount = toInt(parts[0]);
                        result.beforeAmount = toInt(parts[1]);
                        result.amount = Math.abs(result.afterAmount - result.beforeAmount);
                    }
                    else{
                        //http://www.companiesoffice.govt.nz/companies/app/ui/pages/companies/1109509/2636770/entityFilingRequirement
                        // For now, ignore this case
                        return acc;
                    }
                    while(index < segment.length){
                        if(cleanString($(segment[index]).text())){
                            result.beforeHolders.push({
                                name: invertName(cleanString($(segment[index]).find('td').eq(1).text())),
                                address: cleanString($(segment[index]).find('td').eq(2).text())
                            })
                        }
                        index++;
                    }
                    acc.push(result);
                }
                if(type === Transaction.types.NEW_ALLOCATION){
                    let result = {holders:[], beforeAmount: 0,  transactionType: type};
                    result.afterAmount = result.amount = toInt(cleanString($(segment[index++]).find('td').eq(1).text()));

                    while(index < segment.length){
                        if(cleanString($(segment[index]).text())){
                            result.holders.push({
                                name: invertName(cleanString($(segment[index]).find('td').eq(1).text())),
                                address: cleanString($(segment[index]).find('td').eq(2).text())
                            })
                        }
                        index++;
                    }
                    acc.push(result);

                }
                if(type === Transaction.types.REMOVE_ALLOCATION){
                    let result = {holders:[], afterAmount: 0,  transactionType: type};
                    result.beforeAmount = result.amount = toInt(cleanString($(segment[index++]).find('td').eq(1).text()));

                    while(index < segment.length){
                        if(cleanString($(segment[index]).text())){
                            result.holders.push({
                                name: invertName(cleanString($(segment[index]).find('td').eq(1).text())),
                                address: cleanString($(segment[index]).find('td').eq(2).text())
                            })
                        }
                        index++;
                    }
                    acc.push(result);
                }


                return acc;
            }, []);
        }
        else{
            // document looks like http://www.companiesoffice.govt.nz/companies/app/ui/pages/companies/1892698/8579266/entityFilingRequirement
            remaining = start.nextAll();
            // chunk by images
            chunks = chunkBy(remaining.toArray(), (el) => {
                return $(el).find('img').length;
            });

            result.actions = chunks.reduce(function(acc, segment, j){
                let amendAllocRegex = /^\s*Amended Share Parcel\(s\)\s*$/;
                let newAllocRegex = /^\s*New Share Parcel\(s\)\s*$/;
                let removedAllocRegex = /^\s*Removed Share Parcel\(s\)\s*$/;
                let head = $(segment[0]).text();
                if(head.match(amendAllocRegex)){
                    type = Transaction.types.AMEND;
                    return acc;
                }
                else if(head.match(newAllocRegex)){
                    type = Transaction.types.NEW_ALLOCATION;
                    return acc;
                }
                else if(head.match(removedAllocRegex)){
                    type = Transaction.types.REMOVE_ALLOCATION;
                    return acc;
                }

                const parseAmendAllocation = (segment) => {
                    // 0 === current
                    // 1 number shares
                    let index = 1;
                    let result = {beforeHolders: [], afterHolders: [],  transactionType: Transaction.types.AMEND}
                    result.afterAmount = toInt(cleanString($(segment[index++]).find('td').eq(3).text()));
                    while($(segment[index]).find('td').eq(2).text().match(/^\s*•\s*$/)){
                        result.afterHolders.push({
                            name: invertName(cleanString($(segment[index]).find('td').eq(3).text())),
                            address: cleanString($(segment[index]).find('td').eq(4).text())
                        })
                        index++;
                    }
                    // index is now === 'Previous'
                    index++;
                    result.beforeAmount = toInt(cleanString($(segment[index++]).find('td').eq(3).text()));
                    result.amount = Math.abs(result.beforeAmount - result.afterAmount)


                    while($(segment[index]).find('td').eq(2).text().match(/^\s*•\s*$/)){
                        result.beforeHolders.push({
                            name: invertName(cleanString($(segment[index]).find('td').eq(3).text())),
                            address: cleanString($(segment[index]).find('td').eq(4).text())
                        })
                        index++;
                    }
                    const results = [];

                    if(!result.beforeHolders.length){
                        result.holders = result.afterHolders;
                        delete result.afterHolders;
                        delete result.beforeHolders;
                        result.beforeAmount = 0;
                        result.amount = result.afterAmount;
                        result.transactionType = Transaction.types.NEW_ALLOCATION;
                        return [result];
                    }

                    if(JSON.stringify(result.beforeHolders).toLowerCase() !== JSON.stringify(result.afterHolders).toLowerCase()){
                        let difference = result.beforeHolders.length !== result.afterHolders.length
                            // must a holder change or holding transfer
                            // if SAME NAME, different address in same position, then its an UPDATE_HOLDER

                        if(!difference){

                            result.beforeHolders.map((holder, i) => {
                                const nameSame = result.beforeHolders[i].name.toLowerCase() === result.afterHolders[i].name.toLowerCase();
                                if(nameSame &&
                                   result.beforeHolders[i].address.toLowerCase() !== result.afterHolders[i].address.toLowerCase()){
                                    results.push({
                                        transactionType: Transaction.types.HOLDER_CHANGE,
                                        beforeHolder: result.beforeHolders[i],
                                        afterHolder: result.afterHolders[i]
                                    });
                                }
                                else if(!nameSame){
                                    difference = true;
                                }
                            });
                        }
                        if(difference){
                            result.transactionType =  Transaction.types.HOLDING_TRANSFER;
                            return [result];
                        }
                    }

                    if(result.amount){
                        results.push(result);
                    }

                    return results;
                }

                const parseRemoveAllocation = (segment) => {
                    const result = {holders: [], afterAmount: 0, transactionType: Transaction.types.REMOVE_ALLOCATION};
                    let index = 0;
                    result.beforeAmount = toInt(cleanString($(segment[index++]).find('td').eq(3).text()));
                    result.amount = result.beforeAmount;
                    while($(segment[index]).find('td').eq(2).text().match(/^\s*•\s*$/)){
                        result.holders.push({
                            name: invertName(cleanString($(segment[index]).find('td').eq(3).text())),
                            address: cleanString($(segment[index]).find('td').eq(4).text())
                        })
                        index++;
                    }
                    return [result];
                }

                const parseNewAllocation = (segment) => {
                    const result = {holders: [], beforeAmount: 0, transactionType: Transaction.types.NEW_ALLOCATION};
                    let index = 0;
                    result.afterAmount = toInt(cleanString($(segment[index++]).find('td').eq(3).text()));
                    result.amount = result.afterAmount;
                    while($(segment[index]).find('td').eq(2).text().match(/^\s*•\s*$/)){
                        result.holders.push({
                            name: invertName(cleanString($(segment[index]).find('td').eq(3).text())),
                            address: cleanString($(segment[index]).find('td').eq(4).text())
                        })
                        index++;
                    }
                    return [result];
                }


                if(type === Transaction.types.AMEND){
                    return acc.concat(parseAmendAllocation(segment));
                }
                else if(type === Transaction.types.NEW_ALLOCATION){
                    return acc.concat(parseNewAllocation(segment));
                }
                else if(type === Transaction.types.REMOVE_ALLOCATION){
                    return acc.concat(parseRemoveAllocation(segment));
                }
                return acc;
            }, [])
        }
        // there could be duplicate holder changes
        const holder_changes = {};
        result.actions = (result.actions || []).filter(a => {
            if(a.transactionType === Transaction.types.HOLDER_CHANGE){
                if(holder_changes[a.beforeHolder.name]){
                    return false;
                }
                holder_changes[a.beforeHolder.name] = true;
            }
            return true;
        })


        result.totalShares = result.actions.reduce((acc, action) => {
            switch(action.transactionType){
                case Transaction.types.AMEND:
                    return acc + (action.afterAmount - action.beforeAmount)
                case Transaction.types.NEW_ALLOCATION:
                    return acc + action.amount;
                case Transaction.types.REMOVE_ALLOCATION:
                    return acc - action.amount;
                 case Transaction.types.HOLDING_TRANSFER:
                    if(action.amount){
                        return acc + (action.afterAmount - action.beforeAmount)
                    }
                default:
                    return acc;
            }
        }, 0);
       return result;
    },


    [DOCUMENT_TYPES.UPDATE]: () => {

    },


    [DOCUMENT_TYPES.ISSUE]: ($) => {
        const result = {};
        result.transactionType = Transaction.types.ISSUE;
        const match = (match) => {
            return $('table td font').filter(function(){
                return $(this).text().match(match);
            });
        }
        const registeredDate = match(/Registration Date:/);
        const regString = cleanString(registeredDate.text().replace('Registration Date:', ''));
        result.registrationDate = moment(regString, 'DD MMM YYYY').toDate();
        result.afterAmount = toInt(cleanString(match(/\s*Total Number of Company Shares\s*/).parent().next().text()));
        result.amount = toInt(cleanString(match(/\s*Total Number of Shares Issued\s*/).parent().next().text()));
        result.beforeAmount = result.afterAmount - result.amount;
        result.increase = true;
        result.effectiveDate = moment(cleanString(match(/\s*Date of Issue\s*/).parent().next().text()), 'DD MMM YYYY').toDate();
        return {actions: [result], totalShares: result.increase ? -result.amount : result.amount};
    },


    [DOCUMENT_TYPES.PURCHASE]: ($) => {
        const result = {};
        result.transactionType = Transaction.types.ACQUISITION;
        const match = (match) => {
            return $('table td font').filter(function(){
                return $(this).text().match(match);
            });
        }
        const registeredDate = match(/Registration Date:/);
        const regString = cleanString(registeredDate.text().replace('Registration Date:', ''));
        result.registrationDate = moment(regString, 'DD MMM YYYY').toDate();
        result.afterAmount = toInt(cleanString(match(/\s*Total Number of Company Shares\s*/).parent().next().text()));
        result.amount = toInt(cleanString(match(/\s*Total Number of Shares Purchased or Acquired\s*/).parent().next().text()));
        result.beforeAmount = result.afterAmount + result.amount;
        result.increase = false;
        result.effectiveDate = moment(cleanString(match(/\s*Date of Purchase\/Acquisition\s*/).parent().next().text()), 'DD MMM YYYY').toDate();
        return {actions: [result], totalShares: result.increase ? -result.amount : result.amount};
    }

}

const DOCUMENT_TYPE_MAP = {
    'Particulars of Director':{
        type: DOCUMENT_TYPES.PARTICULARS_OF_DIRECTOR
    },
    'Particulars of Shareholding': {
        type: DOCUMENT_TYPES.PARTICULARS
    },
    'Particulars of ultimate holding company': {

    },
    'Change of Company Name': {
        type: DOCUMENT_TYPES.NAME_CHANGE
    },
    'Update Shares': {
        type: DOCUMENT_TYPES.UPDATE
    },
    'Directors Certificate': {

    },
    'File Annual Return': {
        type: DOCUMENT_TYPES.ANNUAL_RETURN
    },
    'Annual Return Filed': {
        type: DOCUMENT_TYPES.ANNUAL_RETURN
    },
    'Particulars of Company Address': {
        type: DOCUMENT_TYPES.ADDRESS_CHANGE
    },
    'New Company Incorporation': {
        type: DOCUMENT_TYPES.INCORPORATION
    },
    'Notice Of Issue Of Shares': {
        type: DOCUMENT_TYPES.ISSUE
    }
};


const BIZ_DOCUMENT_TYPE_MAP = {
    'Application To Incorporate A Company': {
        type: DOCUMENT_TYPES.INCORPORATION
    },
    'Particulars of Shareholding': {
        type: DOCUMENT_TYPES.PARTICULARS
    },
    'Update Shares': {
        type: DOCUMENT_TYPES.UPDATE
    },
    'Notice Of Issue Of Shares': {
        type: DOCUMENT_TYPES.ISSUE
    },
    'Online Annual Return': {
        type: DOCUMENT_TYPES.ANNUAL_RETURN
    },
    'Purchase/Acquisition Of Shares': {
        type: DOCUMENT_TYPES.PURCHASE
    }
};



function processCompaniesOffice($){
    let result = {};
    let typeRegex =/^Document Type$/;
    result.label = textAfterMatch($, '.row.wideLabel label', typeRegex);
    let docType = DOCUMENT_TYPE_MAP[result.label];

    if(docType && docType.type){
        result = {...result, ...EXTRACT_DOCUMENT_MAP[docType.type]($)}
    }
    return result
}

function processBizNet($, info){
    let result = {};
    let docType = BIZ_DOCUMENT_TYPE_MAP[info.documentType];
    if(docType && docType.type){
        result = {...result, ...EXTRACT_BIZ_DOCUMENT_MAP[docType.type]($)}
    }
    return result;
}



function documentUrl(companyNumber, documentId){
    return 'http://www.companiesoffice.govt.nz/companies/app/ui/pages/companies/'+companyNumber+'/'+documentId+'/entityFilingRequirement'
}



const ScrapingService = {
    companiesOfficeURL: 'https://www.companiesoffice.govt.nz/companies/app/ui/pages/companies/',
    fetch: function(companyNumber){
        const url = ScrapingService.companiesOfficeURL+companyNumber+'/detail';
        sails.log.verbose('Getting url', url);
        return new Promise(function(resolve, reject){
                    fetch(url)
                        .then(function(res){
                            return res.text();
                        })
                        .then(resolve)
                        .catch(reject);
                });
    },

    fetchDocument: function(companyNumber, documentId, attempts=0){
        const url = documentUrl(companyNumber, documentId);
        sails.log.verbose('Getting url', url);
        return fetch(url)
                .then(checkStatus)
                .then(function(res){
                    return res.text();
                })
                .then(function(text){
                    let $ = cheerio.load(text);
                    // some bad smells here
                    if($('#biznetMigratedVirtualDocument #integrated-iframe').length){
                        return fetch($('#biznetMigratedVirtualDocument #integrated-iframe').attr('src'))
                            .then(function(res){
                                return res.text();
                            })
                            .then(function(text){
                                const url = /href="(http:\/\/[^ ]+)";/g.exec(text)[1]
                                return fetch(url)
                            })
                            .then(function(res){
                                return res.text();
                            })
                            .then(function(text){
                                const $ = cheerio.load(text);
                                return fetch('http://www.societies.govt.nz/pls/web/' + $('frame[name=LowerFrame]').attr('src'))
                            })
                            .then(function(res){
                                return res.text();
                            })
                            .then(function(text){
                                return {text: text}
                            })
                    }
                    return {text: text};
                })
            .catch(e => {
                if(attempts > 5){
                    //throw new Error(`Cannot get document ${url}`);
                    sails.log.error(`Cannot get document ${url}`);
                    return {text: '', error: 'FAILED_FETCH'};
                }
                return ScrapingService.fetchDocument(companyNumber, documentId, attempts+1)
            })
    },

    fetchSearchResults: function(query){
        const qs = typeof query === 'object' ? 'companies/search?'+querystring.stringify(query) : 'search?q='+encodeURIComponent(query)
        const url = 'https://www.companiesoffice.govt.nz/companies/app/ui/pages/'+ qs +'&type=entities';
        sails.log.verbose('Getting url', url);
        return fetch(url)
            .then(function(res){
                return res.text();
            })
    },

    fetchParentCompanyInfo: function(data){

    },

    cleanUpQuery: function(query) {
        return Promise.resolve(query.replace(/ ltd\.?$/gi, ' LIMITED'))
    },

    getSearchResults: function(query){
        return ScrapingService.fetchSearchResults(query)
            .then(function(html){
                const $ = cheerio.load(html);
                return $('.LSRow.registered a, .LSRow.struckoff a, .LSRow.externaladministration a').map(function(){
                    const $el = $(this);
                    return {
                        companyNumber: _.last($el.attr('href').split('/')),
                        companyName: $el[0].firstChild.data,
                        struckOff: !!$el.find('.struckoffAssertion').length,
                        notes: $el.next('.registryNote').map(function(){
                            return $(this).text();
                        }).get()
                    };
                }).get();
            })
            .then(results => {
                if(!results.length){
                    sails.log.error('Could not find results for : '+ query);
                }
                return results;
            })
    },

    populateDB: function(data, userId){
        return  Company.create({
                ownerId: userId,
                createdById: userId,
            })
            .then(function(company){
                this.company = company;
                sails.log.verbose('Company populated in DB');
                let date = new Date();
                if(data.documents.length){
                    date = moment(data.documents[0].date, 'DD MMM YYYY HH:mm').toDate()
                }
                return TransactionService.performSeed(ScrapingService.prepareSourceData(data, userId), company, date, userId);
            })
            .then(function(){
                sails.log.verbose('CompanyState populated in DB');
                return this.company;
            });
    },

    prepareSourceData: function(data, userId){
        return {
            ...data,
            ...ScrapingService.formatHoldings(data, userId),
            ...ScrapingService.formatDirectors(data, userId),
            ...ScrapingService.formatDocuments(data, userId)
        }
    },

    canonicalizeNZCompaniesData: function(data){
        return data;
    },

    formatHoldings: function(data){
        let result = {};
        let total = data.holdings.total,
            counted = 0;
        result.holdingList = { holdings: data.holdings.allocations.map(function(holding){
                counted += holding.shares;
                return {
                    parcels: [{amount: holding.shares}],
                    holders: holding.holders.map((h) => {
                        return { person: h, data: {}}
                    }),
                    name: (holding.name || '').replace('Allocation', 'Shareholding')
                }
            })
        }
        let difference = total - counted;
        if(difference > 0){
            result.unallocatedParcels = [{amount: difference}];
        }
        return result;
    },

    formatDirectors: function(data){
        let result = {};
        result.directorList = {
            directors : data.directors.map(function(d){
                return {
                    consentUrl: d.consentUrl,
                    appointment: moment(d.appointmentDate, 'DD MMM YYYY HH:mm').toDate(),
                    person: {
                        name: d.fullName,
                        address: d.residentialAddress
                    }
                };
        })};
        return result;
    },

    formatDocuments: function(data, user_id){
        let result = {};
        result.docList = {
            documents: data.documents.map(function(d){
            return {
                originalUrl: d.original,
                sourceUrl: documentUrl(data.companyNumber, d.documentId),
                date: moment(d.date, 'DD MMM YYYY HH:mm').toDate(),
                type: 'Companies Office',
                filename: d.documentType,
                ownerId: user_id,
                createdById: user_id
            };
        }) };
        return result;
    },

    getCachedDocumentSummary: function(data, document){
        let result;
        return Promise.resolve()
            .then(() => fs.readFileAsync(`${sails.config.CACHE_DIR}/${document.documentId}.html`, 'utf-8'))
            .then((text) => {
                return {text: text, documentId: document.documentId}
            })
            .catch(() => {
                return ScrapingService.fetchDocument(data.companyNumber, document.documentId)
                    .then((data) => {
                        result = {...data, documentId: document.documentId}
                        if(sails.config.CACHE_DIR && !data.error){
                            return fs.writeFileAsync(`${sails.config.CACHE_DIR}/${document.documentId}.html`, data.text, 'utf-8');
                        }
                    })
                    .then(data => {
                        return result;
                    });
            })
    },

    getDocumentSummaries: function(data){
        return Promise.map(data.documents, function(document){
            return ScrapingService.getCachedDocumentSummary(data, document);
        }, {concurrency: 10});
    },

    writeDocumentSummaries: function(data, path='test/fixtures/companies_office/'){
        return ScrapingService.getDocumentSummaries(data)
            .then(function(texts){
                return Promise.map(texts, function(data){
                    return fs.writeFileAsync(path+'documents/'+data.documentId+'.html', data.text, 'utf-8');
            });
        });
    },

    writeRootDocument: function(companyNumber, data, path='test/fixtures/companies_office/'){
        return fs.writeFileAsync(path+companyNumber+'.html', data.text, 'utf-8');
    },

    processDocument: function(html, info={}){
        sails.log.verbose('Processing file ', info.documentId)
        const $ = cheerio.load(html);

        let result = {};
        if($('#page-body').length){
            result = processCompaniesOffice($, info)
        }
        else{
            result = processBizNet($, info)
        }
        return {...result, ...info, date: moment(info.date, 'DD MMM YYYY HH:mm').toDate()}
    },

    processDocuments: function(data, readDocuments){
        let processedDocs;
        return Promise.map(data.documents, function(doc) {
            var docData = _.find(readDocuments, {
                documentId: doc.documentId
            });
            return ScrapingService.processDocument(docData.text, doc)
        })
        .then(function(_processedDocs) {
            processedDocs = _processedDocs;
            return InferenceService.extraActions(data, processedDocs);
        })
        .then(function(extraActions){
            processedDocs = extraActions;
            processedDocs = InferenceService.segmentAndSortActions(processedDocs, data.companyNumber);

            sails.log.verbose('Processed ' + processedDocs.length + ' documents');
            return processedDocs;
        });
    },

    parsePreviousNames: function($){
        const pattern = /^\s*(.*) \(from (.*) to (.*)\)/
        return $('.previousNames label').map((i, el) => {
            const matches = pattern.exec($(el).text());
            return {
                name: matches[1],
                startDate: matches[2],
                endDate: matches[3]
            }
        }).get()
    },

    parseNZCompaniesOffice: function(html){
        const $ = cheerio.load(html);
        let result = {};

        result['companyName'] = _.trim($('.leftPanel .row h1')[0].firstChild.data);
        _.merge(result, ['companyNumber', 'nzbn', 'incorporationDate', 'companyStatus', 'entityType'].reduce(function(obj, f){
            try{
                obj[f] = cleanString($('label[for="'+f+'"]')[0].parentNode.lastChild.data)
            }catch(e){};
            return obj;
        }, {}));

        _.merge(result, ['constitutionFiled'].reduce(function(obj, f){
            try{
                obj[f] = _.trim($('label[for="'+f+'"]').next().text()) === 'Yes'
            }catch(e){
                obj[f] = false;
            };
            return obj;
        }, {}));

        _.merge(result, ['arFilingMonth', 'fraReportingMonth'].reduce(function(obj, f){
            try{
                obj[f] = _.trim($('label[for="'+f+'"]')[0].nextSibling.nodeValue.split(',')[0])
            }catch(e){};
            return obj;
        }, {}));

        $('#addressPanel .addressLine').map(function(i, el){
            if($(el).prev().attr('for')){
                result[$(el).prev().attr('for').slice(0, -1)] = cleanString($(el).text());
            }
        });

        try{
            result['ultimateHoldingCompany'] = _.trim($('#ultimateHoldingCompany').parent()[0].firstChild.data) === 'Yes';
        }catch(e){
            result['ultimateHoldingCompany'] = null;
        }

        result['holdings'] = {
            total: toInt($('div.allocations > div.row > span:nth-of-type(1)').text()),
            extensive: $('div.allocations > div.row > span:nth-of-type(2)').hasClass('yesLabel'),
            allocations: $('div.allocationDetail').map(function(i, alloc){
                return {
                    name: 'Allocation ' + $(this).find('span.allocationNumber').text(),
                    shares: toInt($(this).find('input[name="shares"]').val()),
                    holders: _.chunk($(this).find('.labelValue').get(), 2)
                        .map(function(chunk){
                            chunk = [$(chunk[0]), $(chunk[1])];
                            let r = {name: cleanString(chunk[0].text()), address: cleanString(chunk[1].text()) };
                            if(chunk[0].find('a').length){
                                r['companyNumber'] = _.last(chunk[0].find('a').attr('href').split('/'));
                            }
                            return r;
                        })
                }
            }).get()
        }


        const calculatedTotal = result.holdings.allocations.reduce((sum, a) => sum + a.shares, 0);

        // experimental override
        if(calculatedTotal === result.holdings.total){
            result.holdings.extensive = false;
        }

        result.extensive = result.holdings.extensive;



        result['historicHolders'] = $('.historic').find('.shareholder').map(function(i, e){
            return {
                name: $(this).find('.legalName')[0].parentNode.lastChild.data.replace(/\s\s+/g, ' '),
                vacationDate: $(this).find('.vacationDate')[0].parentNode.lastChild.data }
        }).get()

        let documents = [];
        let docIDReg = /javascript:showDocumentDetails\((\d+)\);/;

        $('#documentListPanel .dataList tbody tr').map(function(i, el){
            let $el = $(el);
            if($el.find('td:nth-child(1)').text()){
                if($el.find('td:nth-child(2) a').attr('href')){
                    documents.push({
                        'date': $el.find('td:nth-child(1)').text(),
                        'documentType': _.trim($el.find('td:nth-child(2)').text()),
                        'documentId': $el.find('td:nth-child(2) a').attr('href').match(docIDReg)[1]
                    })
                }
            }
            else{
                _.last(documents)['original'] = $el.find('td:nth-child(2) a').attr('href')
            }
        })
        result['documents'] = documents;
        let directors = [];
        let formerDirectors = [];

        $('.director').map(function(i, el){
            let $el = $(el);
            let obj = {};
            ['fullName', 'residentialAddress', 'appointmentDate', 'ceasedDate'].map(function(f){
                try{
                    obj[f] = cleanString($el.find('label[for="'+f+'"]')[0].parentNode.lastChild.data)
                }catch(e){};
            });
            const link = $el.find('label[for="consent"]').next('.fileName');
            if(link && link.length){
                obj.consentUrl = link.attr('href');
            }

            if($el.parents('.historic').length){
                if(obj.ceasedDate){
                    formerDirectors.push(obj);
                }
                // else, ignore, as is a former director who never quit, impossible
            }
            else{
                directors.push(obj);
            }

        });

        result['directors'] = directors;
        result['formerDirectors'] = formerDirectors;

        const previousNames = ScrapingService.parsePreviousNames($);
        result['previousNames'] = previousNames;
        sails.log.verbose('Parsed company: ', result);
        return result
    }
};

module.exports = ScrapingService;
