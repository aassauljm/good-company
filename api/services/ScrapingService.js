"use strict";
// api/services/scrapingService.js
// es7
const _ = require('lodash');
const cheerio = require('cheerio');
const Promise = require("bluebird");
const fetch = require("isomorphic-fetch");
const fs = Promise.promisifyAll(require("fs"));
const moment = require('moment');
const uuid = require('node-uuid')

const DOCUMENT_TYPES = {
    UPDATE : 'UPDATE',
    PARTICULARS: 'PARTICULARS',
    NAME_CHANGE: 'NAME_CHANGE',
    ANNUAL_RETURN: 'ANNUAL_RETURN',
    ADDRESS_CHANGE: 'ADDRESS_CHANGE',
    INCORPORATION: 'INCORPORATION',
    PARTICULARS_OF_DIRECTOR: 'PARTICULARS_OF_DIRECTOR',
    UNKNOWN: 'UNKNOWN',
};



const toInt = function (value) {
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
        ['fromAmount', 'Previous Number of Shares:', Number],
        ['byAmount', 'Increased Shares by:', Number],
        ['toAmount', 'New Number of Shares:', Number],
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
        ['fromAmount', 'Previous Number of Shares:', Number],
        ['byAmount', 'Decreased Shares by:', Number],
        ['toAmount', 'New Number of Shares:', Number],
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
    if(!result.beforeAmount && !result.afterAmount){
        result.transactionType = Transaction.types.HOLDING_CHANGE;
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
            'Consolidation': Transaction.types.CONSOLIDATION
        }
        let result = {};
        let regex = /^\s*Type of Change:\s*$/;
        result.originaltransactionType = divAfterParent($, '.row .wideLabel label', regex);
        result.transactionType = transactionMap[result.originaltransactionType];
        result.registrationDate = moment($('.row.wideLabel label').filter(function(){
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
            case(Transaction.types.PURCHASE):
                result = {...result, ...parseAcquisition($, 'Date of Purchase:')}
            case(Transaction.types.CONSOLIDATION):
                result = {...result, ...parseAcquisition($, 'Date of Consolidation:')}

                break;
            default:
        }
        return {actions: [result], totalShares: result.increase ? -result.amount : result.amount };
    },
    [DOCUMENT_TYPES.PARTICULARS]: ($) => {
        let result = {};
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
                return {...parseAllocation($, $el), transactionType: Transaction.types.NEW_ALLOCATION};
            }
            else if(head.match(removedAllocRegex)){
                return {...parseAllocation($, $el), transactionType: Transaction.types.REMOVE_ALLOCATION};
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
        return {actions: [
            ...$('#amendmentConfirm').map((i, el)=>{
            return {
                transactionType: Transaction.types.UPDATE_DIRECTOR,
                beforeName: cleanString($(el).find('.before .directorName').text()),
                beforeAddress: cleanString($(el).find('.before .directorAddress').text()),
                afterName: cleanString($(el).find('.after .directorName').text()),
                afterAddress: cleanString($(el).find('.after .directorAddress').text())
        }}).get()]};
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
                transactionType: Transaction.types.DETAILS_MASS
            }]
        }
        const holdings = matchMultline(/Total Number of Company Shares/);

        if(holdings.length){
            const total = toInt(holdings[0]);
            result.actions.push({
                fromAmount: 0,
                toAmount: total,
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
                    amount: parseInt(chunk[0], 10),
                    holders: getHolders(chunk.slice(1))
                })
            })
        }

        const directors = chunkBy($('h2').filter(function(){
                return $(this).text().match(/Directors/)
            })
            .nextUntil('hr')
            .map((i, d) => {
                return cleanString($(d).text());
            }).get(), (d) => {
                return !d
            }).map(d => {
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

            totalShares: parseInt($('span.h3').filter(function(){
                            return $(this).text().match(/Total Number of Shares:/);
                        }).first().next().text(), 10),

            holdings: chunkBy($('span').filter(function(){
                            return $(this).text().match(/Shareholders in Allocation/);
                        })
                            .first()
                            .parent()
                            .nextUntil('.clear'), (el)=>$(el).is('hr')
                        )
                        .map((chunk) => {
                            return {
                            parcels: [{amount: parseInt($(chunk[0]).find('label').text().replace(' Shares', ''), 10)}],
                            holders: _.chunk(chunk, 2).map(holder => ({
                                    name: cleanString($(holder[0]).find('strong').text()),
                                    address: cleanString($(holder[1]).find('.addressLine').text())
                                }))
                            }
                        }),

            effectiveDate:  moment($('.row.wideLabel label').filter(function(){
                    return $(this).text().match(/Registration Date and Time/);
                })[0].nextSibling.nodeValue, 'DD MMM YYYY HH:mm:ss').toDate(),
        }],
        transactionType: Transaction.types.ANNUAL_RETURN
        }
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
    'Particulars of Company Address': {
        type: DOCUMENT_TYPES.ADDRESS_CHANGE
    },
    'New Company Incorporation': {
        type: DOCUMENT_TYPES.INCORPORATION
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

function processBizNet($){
    let result = {};
    return {}
}



function documentUrl(companyNumber, documentId){
    return 'http://www.business.govt.nz/companies/app/ui/pages/companies/'+companyNumber+'/'+documentId+'/entityFilingRequirement'
}



const ScrapingService = {

    fetch: function(companyNumber){
        const url = 'https://www.business.govt.nz/companies/app/ui/pages/companies/'+companyNumber+'/detail';
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

    fetchDocument: function(companyNumber, documentId){
        const url = documentUrl(companyNumber, documentId);
        sails.log.verbose('Getting url', url);
        return fetch(url)
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
    },

    fetchSearchResults: function(query){
        const url = 'https://www.business.govt.nz/companies/app/ui/pages/search?q='+encodeURIComponent(query)+'&type=entities';
        sails.log.verbose('Getting url', url);
        return fetch(url)
            .then(function(res){
                return res.text();
            })
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
    },

    populateDB: function(data, user_id){
        return  Company.create({
                ownerId: user_id,
                createdById: user_id,
            })
            .then(function(company){
                this.company = company;
                sails.log.verbose('Company populated in DB');
                return sails.controllers.companystate.transactions.seed({
                    ...data,
                    ...ScrapingService.formatHoldings(data, user_id),
                    ...ScrapingService.formatDirectors(data, user_id),
                    ...ScrapingService.formatDocuments(data, user_id),
                }, company, new Date());
            })
            .then(function(){
                sails.log.verbose('CompanyState populated in DB');
                return this.company;
            });
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
                    holders: holding.holders,
                    name: holding.name
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
        })};
        return result;
    },

    getCachedDocumentSummary: function(data, document){
        let text;
        return Promise.resolve()
            .then(() => fs.readFileAsync(`${sails.config.CACHE_DIR}/${document.documentId}.html`, 'utf-8'))
            .then((text) => {
                return {text: text, documentId: document.documentId}
            })
            .catch(() => {
                return ScrapingService.fetchDocument(data.companyNumber, document.documentId)
                    .then((data) => {
                        text = data.text;
                        if(sails.config.CACHE_DIR){
                            return fs.writeFileAsync(`${sails.config.CACHE_DIR}/${document.documentId}.html`, text, 'utf-8');
                        }
                    })
                    .then(data => {
                        return {text: text, documentId: document.documentId}
                    })
            })
    },

    getDocumentSummaries: function(data){
        return Promise.map(data.documents, function(document){
            return ScrapingService.getCachedDocumentSummary(data, document);
        }, {concurrency: 5});
    },

    writeDocumentSummaries: function(data){
        return ScrapingService.getDocumentSummaries(data)
            .then(function(texts){
                return Promise.map(texts, function(data){
                    return fs.writeFileAsync('test/fixtures/companies_office/documents/'+data.documentId+'.html', data.text, 'utf-8');
            });
        });
    },

    writeRootDocument: function(companyNumber, data){
        return fs.writeFileAsync('test/fixtures/companies_office/'+companyNumber+'.html', data.text, 'utf-8');
    },

    processDocument: function(html, info={}){
        sails.log.verbose('Processing file ', info.documentId)
        const $ = cheerio.load(html);

        let result = {};
        if($('#page-body').length){
            result = processCompaniesOffice($)
        }
        else{
            result = processBizNet($)
        }
        return {...result, ...info, date: moment(info.date, 'DD MMM YYYY HH:mm').toDate()}
    },

    processDocuments: function(data, readDocuments){
        return Promise.map(data.documents, function(doc) {
            var docData = _.find(readDocuments, {
                documentId: doc.documentId
            });
            return ScrapingService.processDocument(docData.text, doc)
        })
        .then(function(_processedDocs) {
            let processedDocs = _processedDocs.concat(InferenceService.extraActions(data, _processedDocs));
            processedDocs = InferenceService.segmentAndSortActions(processedDocs);
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
            total: parseInt($('div.allocations > div.row > span:nth-of-type(1)').text(), 10),
            extensive: $('div.allocations > div.row > span:nth-of-type(2)').hasClass('yesLabel'),
            allocations: $('div.allocationDetail').map(function(i, alloc){
                return {
                    name: 'Allocation ' + $(this).find('span.allocationNumber').text(),
                    shares: parseInt($(this).find('input[name="shares"]').val(), 10),
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
                        'documentType': $el.find('td:nth-child(2)').text(),
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
