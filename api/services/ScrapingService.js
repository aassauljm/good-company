// api/services/scrapingService.js
// es7
"use strict";
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
    return _.trim(str).replace('\n', '').replace(/\s\s+/g, ' ')
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
        ['from', 'Previous Number of Shares:', Number],
        ['by', 'Increased Shares by:', Number],
        ['to', 'New Number of Shares:', Number],
        ['amount', 'Number of Increased Shares:', Number],
        ['issueDate', 'Date of Issue:', date => moment(date, 'DD MMM YYYY').toDate()]
    ];
    return fields.reduce(function(result, f){
        result[f[0]] = f[2](divAfterMatch($, '.row .wideLabel', new RegExp('^\\s*'+f[1]+'\\s*$')));
        return result;
    }, {})
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
        return result;
    },
    [DOCUMENT_TYPES.PARTICULARS]: ($) => {

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


module.exports = {

    fetch: function(companyID){
        return fetch.get('https://www.business.govt.nz/companies/app/ui/pages/companies/'+companyID+'/detail');
    },

    populateDB: function(data){
        return Company.create(ScrapingService.canonicalizeNZCompaniesData(data))
    },
    canonicalizeNZCompaniesData: function(data){
        let result = {...data};
        let total = result.holdings.total;
        result.holdings = result.holdings.allocations.map(function(holding){
            return {
                parcels: [{amount: holding.shares}],
                holders: holding.holders
            }
        });
        return result;
    },
    getDocumentSummaries: function(data){
        return Promise.map(data.documents, function(document){
            let url = 'http://www.business.govt.nz/companies/app/ui/pages/companies/'+data.companyNumber+'/'+document.documentId+'/entityFilingRequirement';
            sails.log.verbose('Getting url', url);
            return fetch(url)
            .then(function(res){
                return res.text();
            })
        }, {concurrency: 3});
    },
    writeDocumentSummaries: function(data){
        return getDocumentSummaries(data)
            .then(function(texts){
                return Promise.map(texts, function(text){
                    return fs.writeFileAsync('test/fixtures/companies_office/documents/'+document.documentId+'.html', text, 'utf-8');
            });
        });
    },
    processDocument: function(html){
        let $ = cheerio.load(html);
        let result = {};
        let typeRegex =/^Document Type$/;
        result.type = textAfterMatch($, '.row.wideLabel label', typeRegex) || "UNKNOWN";
        let docType = DOCUMENT_TYPE_MAP[result.type]
        if(docType && docType.type){
            result = {...result, ...extractTypes[docType.type]($)}
        }
        console.log(result)
        return result;
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
