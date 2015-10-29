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
    UNKNOWN: 'UNKNOWN'
};


function cleanString(str){
    return _.trim(str).replace(/[\n\r]/g, '').replace(/\s\s+/g, ' ')
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

function parseIssue($){
    let fields = [
        ['fromAmount', 'Previous Number of Shares:', Number],
        ['byAmount', 'Increased Shares by:', Number],
        ['toAmount', 'New Number of Shares:', Number],
        ['amount', 'Number of Increased Shares:', Number],
        ['issueDate', 'Date of Issue:', date => moment(date, 'DD MMM YYYY').toDate()]
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

let extractTypes = {
    [DOCUMENT_TYPES.UPDATE]: ($) => {
        let transactionMap = {
            'Issue': Transaction.types.ISSUE
        }

        let result = {};
        let regex = /^\s*Type of Change:\s*$/;
        result.originaltransactionType = divAfterParent($, '.row .wideLabel label', regex);
        result.transactionType = transactionMap[result.originaltransactionType];
        switch(result.transactionType){
            case(Transaction.types.ISSUE):
                result = {...result, ...parseIssue($)}
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

    }
}



let DOCUMENT_TYPE_MAP = {
    'Particulars of Director':{

    },
    'Particulars of Shareholding': {
        type: DOCUMENT_TYPES.PARTICULARS
    },
    'Particulars of ultimate holding company': {

    },
    'Update Shares': {
        type: DOCUMENT_TYPES.UPDATE
    },
    'Directors Certificate': {

    }
};


function processCompaniesOffice($){
    let result = {};
    let typeRegex =/^Document Type$/;
    result.label = textAfterMatch($, '.row.wideLabel label', typeRegex);
    let docType = DOCUMENT_TYPE_MAP[result.label]
    if(docType && docType.type){
        result = {...result, ...extractTypes[docType.type]($)}
    }

    return result
}

function processBizNet($){
    let result = {};
    return {}
}


function validateInverseAmend(amend, companyState){
    let holding = companyState.getMatchingHolding(amend.afterHolders);
    let sum = _.sum(holding.parcels, function(p){
        return p.amount;
    });
    if(!Number.isSafeInteger(sum)){
        throw new sails.config.exceptions.InvalidInverseOperation('Unsafe number')
    }
    if(sum != amend.afterAmount){
        throw new sails.config.exceptions.InvalidInverseOperation('After amount does not match, amend')
    }
    return Promise.resolve();
}

function validateInverseIssue(data, companyState){
    companyState.stats()
        .then(function(stats){
            if(!Number.isInteger(data.amount) || data.amount <= 0 ){
                throw new sails.config.exceptions.InvalidInverseOperation('Amount must be postive integer')
            }
            if(!Number.isSafeInteger(data.amount)){
                throw new sails.config.exceptions.InvalidInverseOperation('Unsafe number')
            }
            if(stats.totalShares != data.toAmount){
                throw new sails.config.exceptions.InvalidInverseOperation('After amount does not match, issue ')
            }
            if(data.fromAmount + data.amount !== data.toAmount ){
                throw new sails.config.exceptions.InvalidInverseOperation('Issue amount sums to not add up')
            }
        })
}


function performInverseIssue(data, companyState){
    validateInverseIssue(data, companyState);
    // In an issue we remove from unallocatedShares
    companyState.subtractUnallocatedParcels({amount: data.amount});
    return Transaction.build({type: data.transactionType, data: data})
}

function performInverseAmend(data, companyState){
    validateInverseAmend(data, companyState)
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
    return Transaction.build({type: data.transactionType,  data: data})
}


function performInverseNewAllocation(data, companyState){
    companyState.combineUnallocatedParcels({amount: data.amount});
    let holding = companyState.getMatchingHolding(data.holders);
    if(!holding){
        throw new sails.config.exceptions.InvalidInverseOperation('Cannot find holding, new allocation')
    }
    let sum = _.sum(holding.parcels, function(p){
        return p.amount;
    });
    if(sum !== data.amount){
        throw new sails.config.exceptions.InvalidInverseOperation('Allocation total does not match, new allocaiton')
    }
    companyState.dataValues.holdings = _.without(companyState.dataValues.holdings, holding);
    return Transaction.build({type: data.transactionType,  data: data})
}

function performInverseRemoveAllocation(data, companyState){
    companyState.subtractUnallocatedParcels({amount: data.amount});
    companyState.dataValues.holdings.push(Holding.buildDeep({
        holders: data.holders, parcels: [{amount: data.amount}]}));
    return Transaction.build({type: data.transactionType,  data: data})
}

module.exports = {

    fetch: function(companyNumber){
        let url = 'https://www.business.govt.nz/companies/app/ui/pages/companies/'+companyNumber+'/detail';
        sails.log.verbose('Getting url', url);
        return fetch(url)
                .then(function(res){
                    return res.text();
                });
    },

    fetchDocument: function(companyNumber, documentId){
        let url = 'http://www.business.govt.nz/companies/app/ui/pages/companies/'+companyNumber+'/'+documentId+'/entityFilingRequirement'
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
                                let url = /href="(http:\/\/[^ ]+)";/g.exec(text)[1]
                                return fetch(url)
                            })
                            .then(function(res){
                                return res.text();
                            })
                            .then(function(text){
                                let $ = cheerio.load(text);
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

    populateDB: function(data){
        return Company.create(data)
            .then(function(company){
                this.company = company;
                return sails.controllers.companystate.transactions.seed(ScrapingService.formatHolders(data), company);
            })
            .then(function(){
                return this.company;
            });
    },

    populateHistory: function(data, company){
        if(!data.actions){
            return;
        }
        let rootState, currentRoot, transactions;
        return sequelize.transaction(function(t){
            return company.getRootCompanyState()
                .then(function(_rootState){
                    currentRoot = _rootState;
                    return currentRoot.buildPrevious({transaction:
                        {type: Transaction.types.COMPOUND,
                            data: _.omit(data, 'actions')
                        }})
                })
                .then(function(_rootState){
                    rootState = _rootState;
                    return Promise.map(data.actions, function(action){
                        switch(action.transactionType){
                            case(Transaction.types.AMEND):
                                return performInverseAmend(action, rootState);
                            case(Transaction.types.ISSUE):
                                return performInverseIssue(action, rootState);
                            case(Transaction.types.NEW_ALLOCATION):
                                return performInverseNewAllocation(action, rootState);
                            case(Transaction.types.REMOVE_ALLOCATION):
                                return performInverseRemoveAllocation(action, rootState);
                            default:

                        }
                    }, {concurrecy: 1})

                })
                .then(function(transactions){
                    rootState.dataValues.transaction.dataValues.childTransactions = _.filter(transactions);
                    return rootState.save();
                })
                .then(function(_rootState){
                    currentRoot.setPreviousCompanyState(_rootState);
                    return currentRoot.save();
                })
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

    getDocumentSummaries: function(data){
        return Promise.map(data.documents, function(document){
            return ScrapingService.fetchDocument(data.companyNumber, document.documentId)
                .then(function(data){
                    return {...data, documentId: document.documentId}
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

    processDocument: function(html, info){
        let $ = cheerio.load(html),
            result = {};
        if($('#page-body').length){
            result = processCompaniesOffice($)
        }
        else{
            result = processBizNet($)
        }
        return {...result, ...info, date: moment(info.date, 'DD MMM YYYY HH:mm').toDate()}
    },

    parseNZCompaniesOffice: function(html){
        let $ = cheerio.load(html);
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

        _.merge(result, ['registeredCompanyAddress2', 'addressForService1', 'addressForShareRegister0'].reduce(function(obj, f){
            try{
                obj[f.slice(0, -1)] = cleanString($('label[for="'+f+'"]').next().text())
            }catch(e){};
            return obj;
        }, {}));


        result['ultimateHoldingCompany'] = _.trim($('#ultimateHoldingCompany').parent()[0].firstChild.data) === 'Yes';


        result['holdings'] = {
            total: parseInt($('div.allocations > div.row > span:nth-of-type(1)').text(), 10),
            extensive: $('div.allocations > div.row > span:nth-of-type(2)').hasClass('yesLabel'),
            allocations: $('div.allocationDetail').map(function(i, alloc){
                return {
                    name: 'Allocation ' + $(this).find('span.allocationNumber').text(),
                    shares: parseInt($(this).find('input[name="shares"]').val(), 0),
                    holders: _.chunk($(this).find('.labelValue').get(), 2)
                        .map(function(chunk){
                            chunk = [$(chunk[0]), $(chunk[1])];
                            let r = {name: _.trim(chunk[0].text()).replace(/\s\s+/g, ' '), address: _.trim(chunk[1].text()).replace('\n', '')};
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
                documents.push({
                    'date': $el.find('td:nth-child(1)').text(),
                    'documentType': $el.find('td:nth-child(2)').text(),
                    'documentId': $el.find('td:nth-child(2) a').attr('href').match(docIDReg)[1]
                })
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
            if(obj.ceasedDate){
                formerDirectors.push(obj);
            }
            else{
                directors.push(obj);
            }

        })
        result['directors'] = directors;
        result['formerDirectors'] = formerDirectors;
        return result
    }

}
