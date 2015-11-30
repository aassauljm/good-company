"use strict";
// api/services/scrapingService.js
// es7
let _ = require('lodash');
let cheerio = require('cheerio');
let Promise = require("bluebird");
let fetch = require("isomorphic-fetch");
let fs = Promise.promisifyAll(require("fs"));
let moment = require('moment');


let DOCUMENT_TYPES = {
    UPDATE : 'UPDATE',
    PARTICULARS: 'PARTICULARS',
    NAME_CHANGE: 'NAME_CHANGE',
    ANNUAL_RETURN: 'ANNUAL_RETURN',
    ADDRESS_CHANGE: 'ADDRESS_CHANGE',
    //PARTICULARS_OF_DIRECTOR: 'PARTICULARS_OF_DIRECTOR',
    UNKNOWN: 'UNKNOWN',
};


function cleanString(str){
    return _.trim(str).replace(/[\n\r]/g, '').replace(/\s\s+/g, ' ').replace(/\s,/g, ',').replace(/,$/, '')
}


function chunkBy(array, func){
    return _.dropRight(_.reduce(array, (acc, el) => {
        if(func(el)){
            acc.push([]);
        }
        else{
            _.last(acc).push(el);
        }
        return acc;
    }, [[]]), );
}

function normalizeAddress(address){
    return (address || '').replace(/^C\/- /, '').replace(/, \d{4,5}, /, ', ');
}


function parseName(text){
    text = cleanString(text);
    let companyNumberRegex = /^\s*(.*)\( ([0-9]{5,}) \)\s*$/g,
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
    }, {})
}

function parseAmendAllocation($, $el){
   return {
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
            'Conversion/Subdivision of Shares': Transaction.types.CONVERSION
        }

        let result = {};
        let regex = /^\s*Type of Change:\s*$/;
        result.originaltransactionType = divAfterParent($, '.row .wideLabel label', regex);
        result.transactionType = transactionMap[result.originaltransactionType];
        switch(result.transactionType){
            case(Transaction.types.ISSUE):
                result = {...result, ...parseIssue($)}
                break;
            case(Transaction.types.CONVERSION):
                result = {...result, ...parseIssue($, 'Date of Conversion/Subdivision:')}
                break;
            default:
        }
        return {actions: [result]};
    },
    [DOCUMENT_TYPES.PARTICULARS]: ($) => {
        let result = {};
        result.actions = $('#reviewContactChangesContent .panel').map(function(){
            let $el = $(this);
            let amendAllocRegex = /^\s*Amended Share Allocation\s*$/;
            let newAllocRegex = /^\s*New Share Allocation\s*$/;
            let removedAllocRegex = /^\s*Removed Share Allocation\s*$/;
            let newHolderRegex = /^\s*New Shareholder\s*$/;
            let removedHolderRegex = /^\s*Removed Shareholder\s*$/;
            let head = cleanString($el.find('.head').text());
            if(head.match(amendAllocRegex)){
                return parseAmendAllocation($, $el);
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

        // a kludge to add companyNumbers from new/removeHolder to new/remove allocation

        let idMap = result.actions.reduce(function(acc, action){
            _.each(action.holders, function(holder){
                if(holder.companyNumber){
                    acc[holder.name] = holder.companyNumber;
                }
            });
            return acc;
        }, {});

        result.actions.map(function(a){
            if(a.transactionType === Transaction.types.NEW_ALLOCATION ||
               a.transactionType === Transaction.types.REMOVE_ALLOCATION){
                _.each(a.holders, function(holder){
                    if(idMap[holder.name]){
                        holder.companyNumber = idMap[holder.name];
                    }
                });
            }
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
            if($(el).find('.afterPanel .row').length){
                return {
                    transactionType: Transaction.types.ADDRESS_CHANGE,
                    previousAddress: cleanString($(el).find('.beforePanel .row').eq(1).text()),
                    newAddress: cleanString($(el).find('.afterPanel .row').eq(1).text()),
                    effectiveDate: moment(cleanString($(el).find('.afterPanel .row').eq(2).text()), 'DD MMM YYYY').toDate(),
                    field: HEADING_MAP[cleanString($(el).find('.head').text())]
                }
            }
            if($(el).find('.head').text().indexOf('Removed') === 0){
                return {
                    transactionType: Transaction.types.ADDRESS_CHANGE,
                    previousAddress: cleanString($(el).find('.row').eq(0).text()),
                    newAddress: null,
                    effectiveDate: moment(cleanString($(el).find('.row').eq(1).text()), 'DD MMM YYYY').toDate(),
                    field: HEADING_MAP[cleanString($(el).find('.head').text())]
                }
            }
            return {
                transactionType: Transaction.types.ADDRESS_CHANGE,
                previousAddress: null,
                newAddress: cleanString($(el).find('.row').eq(0).text()),
                effectiveDate: moment(cleanString($(el).find('.row').eq(1).text()), 'DD MMM YYYY').toDate(),
                field: HEADING_MAP[cleanString($(el).find('.head').text())]
            }
        }).get()};
    },

    [DOCUMENT_TYPES.PARTICULARS_OF_DIRECTOR]: ($) => {
        return {actions: $('#ceaseConfirm, #pendingConfirm').map((i, el)=>{
            return {
                transactionType: $(el).is('#ceaseConfirm') ? Transaction.types.REMOVE_DIRECTOR : Transaction.types.NEW_DIRECTOR,
                name: cleanString($(el).find('.directorName').text()),
                address: cleanString($(el).find('.directorAddress').text()),
                effectiveDate: moment(cleanString($(el).find('.directorCeasedDate.value, .directorAppointmentDate').text()), 'DD/MM/YYYY').toDate(),
        }}).get()};
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
                })[0].nextSibling.nodeValue, 'DD MMM YYYY HH:mm').toDate(),
        }]}
    }
}


const DOCUMENT_TYPE_MAP = {
    'Particulars of Director':{
        //type: DOCUMENT_TYPES.PARTICULARS_OF_DIRECTOR
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

function validateAnnualReturn(data, companyState, effectiveDate){
    return companyState.stats()
        .then(function(stats){
            if(stats.totalShares != data.totalShares){
                throw new sails.config.exceptions.InvalidInverseOperation('Total shares do not match, documentId: ' +documentId);
            }
            const state = companyState.toJSON();
            // extract address and name for directors
            const currentDirectors = JSON.stringify(_.sortBy(_.map(state.directors, (d)=>_.pick(d.person, 'name'/*, 'address'*/)), 'name'));
            const expectedDirectors = JSON.stringify(_.sortBy(_.map(data.directors, (d)=>_.pick(d, 'name'/*, 'address'*/)), 'name'));

            function holdingToString(holdings){
                return _.sortByAll(holdings.map((holding)=>{
                    return  {holders: _.sortBy(holding.holders.map((p)=>_.pick(p, 'name')), 'name'), parcels: holding.parcels.map((p)=>_.pick(p, 'amount'))};
                }), (holding) => -holding.parcels[0].amount, (holding) => holding.holders[0].name);

            }

            const currentHoldings = holdingToString(state.holdings)
            const expectedHoldings = holdingToString(data.holdings)

            if(JSON.stringify(currentDirectors) != JSON.stringify(expectedDirectors)){
                sails.log.error('Current directors: '+JSON.stringify(currentDirectors) + 'documentId: ' +data.documentId)
                sails.log.error('Expected directors: '+JSON.stringify(expectedDirectors))
                throw new sails.config.exceptions.InvalidInverseOperation('Directors do not match: ' +data.documentId);
            }
            if(JSON.stringify(currentHoldings) !== JSON.stringify(expectedHoldings)){
                sails.log.error(JSON.stringify(currentHoldings))
                sails.log.error(JSON.stringify(expectedHoldings))
                throw new sails.config.exceptions.InvalidInverseOperation('Holdings do not match, documentId: ' +data.documentId);
            }
            if(normalizeAddress(state.registeredCompanyAddress) !== normalizeAddress(data.registeredCompanyAddress) ||
                 normalizeAddress(state.addressForService) !== normalizeAddress(data.addressForService)){
                sails.log.error(state.registeredCompanyAddress, data.registeredCompanyAddress)
                sails.log.error(state.addressForService, data.addressForService)
                throw new sails.config.exceptions.InvalidInverseOperation('Addresses do not match, documentId: ' +data.documentId);
            }

        });
};

function validateInverseAmend(amend, companyState){
    let holding = companyState.getMatchingHolding(amend.afterHolders);
    if(!holding){
        throw new sails.config.exceptions.InvalidInverseOperation('Matching Holder not found, documentId: ' +data.documentId)
    }
    let sum = _.sum(holding.parcels, function(p){
        return p.amount;
    });
    if(!Number.isSafeInteger(sum)){
        throw new sails.config.exceptions.InvalidInverseOperation('Unsafe number, documentId: ' +data.documentId)
    }
    if(amend.afterAmount && sum != amend.afterAmount){
        throw new sails.config.exceptions.InvalidInverseOperation('After amount does not match, amend, documentId: ' +data.documentId)
    }
    return Promise.resolve();
}

function validateInverseIssue(data, companyState){
    return companyState.stats()
        .then(function(stats){
            if(!Number.isInteger(data.amount) || data.amount <= 0 ){
                throw new sails.config.exceptions.InvalidInverseOperation('Amount must be postive integer, documentId: ' +data.documentId)
            }
            if(!Number.isSafeInteger(data.amount)){
                throw new sails.config.exceptions.InvalidInverseOperation('Unsafe number, documentId: ' +data.documentId)
            }
            if(stats.totalShares != data.toAmount){
                sails.log.debug(stats)
                throw new sails.config.exceptions.InvalidInverseOperation('After amount does not match, issue, documentId: ' +data.documentId)
            }
            if(data.fromAmount + data.amount !== data.toAmount ){

                throw new sails.config.exceptions.InvalidInverseOperation('Issue amount sums to not add up, documentId: ' +data.documentId)
            }
        })
}


function performInverseIssue(data, companyState, effectiveDate){
    return validateInverseIssue(data, companyState)
        .then(() => {
            companyState.subtractUnallocatedParcels({amount: data.amount});
            return Transaction.build({type: data.transactionType, data: data, effectiveDate: effectiveDate})

        })
    // In an issue we remove from unallocatedShares
}

function performInverseConversion(data, companyState, effectiveDate){
    return validateInverseIssue(data, companyState)
        .then(() => {
            companyState.subtractUnallocatedParcels({amount: data.amount});
            return Transaction.build({type: data.transactionType, data: data, effectiveDate: effectiveDate})

        })
    // In an issue we remove from unallocatedShares
}
function performInverseAmend(data, companyState, effectiveDate){
    validateInverseAmend(data, companyState)
        .then(function(){
            if(!data.afterAmount){

                let current = companyState.getMatchingHolding(data.afterHolders);
                let previous = companyState.getMatchingHolding(data.beforeHolders) || Holding.buildDeep({holders: data.beforeHolders});
                previous.combineParcels(current);
                companyState.dataValues.holdings = _.without(companyState.dataValues.holdings, current);
                if(!_.includes(companyState.dataValues.holdings, previous)){
                    companyState.dataValues.holdings = companyState.dataValues.holdings.concat([previous])
                }
                return Transaction.build({type: Transaction.types.TRANSFER,  data: data});
            }
            else{
                let difference = data.afterAmount - data.beforeAmount;
                let parcel = {amount: Math.abs(difference)};
                let holding = {holders: data.afterHolders, parcels: [parcel]};
                if(difference < 0){
                    companyState.subtractUnallocatedParcels(parcel);
                    companyState.combineHoldings([holding]);
                }
                else{
                    companyState.combineUnallocatedParcels(parcel);
                    companyState.subtractHoldings([holding]);
                }
                return Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
            }
        });
}


function performInverseNewAllocation(data, companyState, effectiveDate){
    companyState.combineUnallocatedParcels({amount: data.amount});
    let holding = companyState.getMatchingHolding(data.holders);

    if(!holding){
        throw new sails.config.exceptions.InvalidInverseOperation('Cannot find holding, new allocation, documentId: ' +data.documentId)
    }
    let sum = _.sum(holding.parcels, function(p){
        return p.amount;
    });
    if(sum !== data.amount){
        sails.log.debug(sum, data);
        throw new sails.config.exceptions.InvalidInverseOperation('Allocation total does not match, new allocation, documentId: ' +data.documentId)
    }
    companyState.dataValues.holdings = _.without(companyState.dataValues.holdings, holding);
    return Promise.resolve(Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate}))
}

function performInverseRemoveAllocation(data, companyState, effectiveDate){
    companyState.subtractUnallocatedParcels({amount: data.amount});
    companyState.dataValues.holdings.push(Holding.buildDeep({
        holders: data.holders, parcels: [{amount: data.amount}]}));
    return Promise.resolve(Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate}))
}


function validateInverseNameChange(data, companyState, effectiveDate){
    if(data.newCompanyName !== companyState.companyName){
        throw new sails.config.exceptions.InvalidInverseOperation('New company name does not match expected name, documentId: ' +data.documentId)
    }
}

function performInverseNameChange(data, companyState, effectiveDate){
    validateInverseNameChange(data, companyState);
    companyState.set('companyName', data.previousCompanyName);
    return Promise.resolve(Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate}))
}

function validateInverseAddressChange(data, companyState, effectiveDate){
    if(normalizeAddress(data.newAddress) !== normalizeAddress(companyState[data.field])){
        throw new sails.config.exceptions.InvalidInverseOperation('New address does not match expected name, documentId: ' +data.documentId)
    }
}

function performInverseAddressChange(data, companyState, effectiveDate){
    validateInverseAddressChange(data, companyState);
    companyState.set(data.field, data.previousAddress);
    return Promise.resolve(Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate}))
}

function validateNewDirector(data, companyState){
    const director = _.find(companyState.dataValues.directors, function(d){
        return d.person.name === data.name ; /*&& d.person.address === data.address */;
    })
    if(!director){
        throw new sails.config.exceptions.InvalidInverseOperation('Could not find expected new director, documentId: ' +data.documentId)
    }
}


function performNewDirector(data, companyState, effectiveDate){
    validateNewDirector(data, companyState);
    companyState.dataValues.directors = _.reject(companyState.dataValues.directors, function(d){
        return d.person.name === data.name /*&&  && d.person.address == data.address */;
    });
    return Promise.resolve(Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate}))
}

function performRemoveDirector(data, companyState, effectiveDate){
    companyState.dataValues.directors.push(Director.build({
        appointment: effectiveDate, person: {name: data.name, address: data.address}},
        {include: [{model: Person, as: 'person'}]}));
    return Promise.resolve(Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate}))
}

function inferDirectorshipActions(data){
    // The appointment and removal of directorships
    const results = [];
    data.directors.forEach(d => {
        const date = moment(d.appointmentDate, 'DD MMM YYYY').toDate();
        results.push({
            actions: [{
                transactionType: Transaction.types.NEW_DIRECTOR,
                name: d.fullName,
                address: d.residentialAddress,
                date: date
            }],
            date: date,
        });
    });
    data.formerDirectors.forEach(d => {
        const appointmentDate = moment(d.appointmentDate, 'DD MMM YYYY').toDate(),
            ceasedDate = moment(d.ceasedDate, 'DD MMM YYYY').toDate();
        results.push({
            actions: [{
                transactionType: Transaction.types.NEW_DIRECTOR,
                name: d.fullName,
                address: d.residentialAddress,
                date: appointmentDate
            }],
            date: appointmentDate,
        });
        results.push({
            actions: [{
                transactionType: Transaction.types.REMOVE_DIRECTOR,
                name: d.fullName,
                address: d.residentialAddress,
                date: ceasedDate
            }],
            date: ceasedDate,
        });
    });
    return results;
}


module.exports = {

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
        const url = 'http://www.business.govt.nz/companies/app/ui/pages/companies/'+companyNumber+'/'+documentId+'/entityFilingRequirement'
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
        return this.fetchSearchResults(query)
            .then(function(html){
                const $ = cheerio.load(html);
                return $('.LSRow.registered a, .LSRow.struckoff a').map(function(){
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

    populateDB: function(data){
        return  Company.create({
            ownerId: data.ownerId,
            creatorId: data.creatorId,
            seedCompanyState: data
        },
            {include: [{model: CompanyState, as: 'seedCompanyState'}]}
            )
            .then(function(company){
                this.company = company;
                sails.log.verbose('Company populated in DB');
                return sails.controllers.companystate.transactions.seed({
                    ...data,
                    ...ScrapingService.formatHolders(data),
                    ...ScrapingService.formatDirectors(data),
                }, company, new Date());
            })
            .then(function(){
                sails.log.verbose('CompanyState populated in DB');
                return this.company;
            });
    },

    populateHistory: function(data, company){

        const PERFORM_ACTION_MAP = {
            [Transaction.types.AMEND]:  performInverseAmend,
            [Transaction.types.ISSUE]:  performInverseIssue,
            [Transaction.types.CONVERSION]:  performInverseConversion,
            [Transaction.types.NEW_ALLOCATION]:  performInverseNewAllocation,
            [Transaction.types.REMOVE_ALLOCATION]: performInverseRemoveAllocation,
            [Transaction.types.NAME_CHANGE]: performInverseNameChange,
            [Transaction.types.ADDRESS_CHANGE]: performInverseAddressChange,
            [Transaction.types.NEW_DIRECTOR]: performNewDirector,
            [Transaction.types.REMOVE_DIRECTOR]: performRemoveDirector,
            [Transaction.types.ANNUAL_RETURN]: validateAnnualReturn
        };

        if(!data.actions){
            return;
        }
        let rootState, currentRoot, transactions;
        return company.getRootCompanyState()
            .then(function(_rootState){
                currentRoot = _rootState;
                return currentRoot.buildPrevious({transaction:
                    {type: Transaction.types.COMPOUND,
                        data: _.omit(data, 'actions'),
                        effectiveDate: data.effectiveDate
                    }})
            })
            .then(function(_rootState){
                rootState = _rootState;
                return Promise.reduce(data.actions, function(arr, action){
                    sails.log.verbose('Performing action: ', JSON.stringify(action, null, 4), data.documentId);
                    let result;
                    if(PERFORM_ACTION_MAP[action.transactionType]){
                        result = PERFORM_ACTION_MAP[action.transactionType]({
                            ...action, documentId: data.documentId
                        }, rootState, data.effectiveDate);
                    }
                    if(result){
                        return result.then(function(r){
                            arr.push(r);
                            return arr;
                        });
                    }
                    return arr;
                }, [])

            })
            .then(function(transactions){
                rootState.dataValues.transaction.dataValues.childTransactions = _.filter(transactions);
                return rootState.save();
            })
            .then(function(_rootState){
                currentRoot.setPreviousCompanyState(_rootState);
                return currentRoot.save();
            })

    },

    canonicalizeNZCompaniesData: function(data){
        return data;
    },

    formatHolders: function(data){
        let result = {};
        let total = data.holdings.total,
            counted = 0;
        result.holdings = data.holdings.allocations.map(function(holding){
                counted += holding.shares;
                return {
                    parcels: [{amount: holding.shares}],
                    holders: holding.holders,
                }
            })
        let difference = total - counted;
        if(difference > 0){
            result.unallocatedParcels = [{amount: difference}];
        }
        return result;
    },

    formatDirectors: function(data){
        let result = {};
        result.directors = data.directors.map(function(d){
                return {
                    consentUrl: d.consentUrl,
                    appointment: moment(d.appointmentDate, 'DD MMM YYYY HH:mm').toDate(),
                    person: {
                        name: d.fullName,
                        address: d.residentialAddress
                    }
                };
            });
        return result;
    },

    getDocumentSummaries: function(data){
        return Promise.map(data.documents, function(document){
            return ScrapingService.fetchDocument(data.companyNumber, document.documentId)
                .then(function(data){
                    return {text: data.text, documentId: document.documentId}
                })
        }, {concurrency: 3});
    },

    writeDocumentSummaries: function(data){
        return ScrapingService.getDocumentSummaries(data)
            .then(function(texts){
                return Promise.map(texts, function(data){
                    return fs.writeFileAsync('test/fixtures/companies_office/documents/'+data.documentId+'.html', data.text, 'utf-8');
            });
        });
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

    extraActions: function(data){
        // This are INFERED actions
        const results = inferDirectorshipActions(data);
        return results;
    },


    segmentActions: function(docs){
        // split group actions by date,

        docs = docs.reduce((acc, doc) =>{
            const docDate = doc.date;
            const groups = _.groupBy(doc.actions, action => action.effectiveDate);

            const copyDoc = (doc) => {
                return _.omit(doc, 'actions');
            }

            const setDate = (doc) => {
                doc.effectiveDate = _.min(doc.actions || [], (a) => a.effectiveDate ? a.effectiveDate : docDate).effectiveDate || docDate;
                return doc;
            }

            if(Object.keys(groups).length > 1){
                Object.keys(groups).map(k => {
                    const newDoc = copyDoc(doc);
                    newDoc.actions = groups[k];
                    acc.push(setDate(newDoc));
                });
            }
            else{
                acc.push(setDate(doc));
            }
            return acc;
        }, []);

        docs = _.sortByAll(docs, 'effectiveDate', (d)=>parseInt(d.documentId, 10)).reverse();
        return docs;
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

        result['ultimateHoldingCompany'] = _.trim($('#ultimateHoldingCompany').parent()[0].firstChild.data) === 'Yes';


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
        let directors = []
        let formerDirectors = []
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
            if(obj.ceasedDate){
                formerDirectors.push(obj);
            }
            else{
                directors.push(obj);
            }

        })
        result['directors'] = directors;
        result['formerDirectors'] = formerDirectors;
        sails.log.verbose('Parsed company: ', result);
        return result
    }

}
