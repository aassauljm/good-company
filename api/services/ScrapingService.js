// api/services/scrapingService.js
"use strict";
var _ = require('lodash');
var cheerio = require('cheerio');
var request = require("supertest-as-promised");

module.exports = {

    fetch: function(companyID){
        return req.get('https://www.business.govt.nz/companies/app/ui/pages/companies/'+companyID+'/detail');
    },

    populateDB: function(data){
        return Company.create(ScrapingService.canonicalizeNZCompaniesData(data))
    },
    canonicalizeNZCompaniesData: function(data){
        var result = _.merge({}, data);
        var total = result.shareholdings.total;
        result.shareholdings = result.shareholdings.allocations.map(function(shareholding){
            return {
                parcels: [{amount: shareholding.shares}],
                shareholders: shareholding.holders
            }
        });
        return result;
    },
    parseNZCompaniesOffice: function(html){
        var $ = cheerio.load(html);
        var result = {};

        result['companyName'] = _.trim($('.leftPanel .row h1')[0].firstChild.data);
        _.merge(result, ['companyNumber', 'nzbn', 'incorporationDate', 'companyStatus', 'entityType'].reduce(function(obj, f){
            try{
                obj[f] = _.trim($('label[for="'+f+'"]')[0].parentNode.lastChild.data).replace(/\s\s+/g, ' ');
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
                obj[f.slice(0, -1)] = _.trim($('label[for="'+f+'"]').next().text()).replace('\n', '').replace(/\s\s+/g, ' ')
            }catch(e){};
            return obj;
        }, {}));


        result['ultimateHoldingCompany'] = _.trim($('#ultimateHoldingCompany').parent()[0].firstChild.data) === 'Yes';


        result['shareholdings'] = {
            total: parseInt($('div.allocations > div.row > span:nth-of-type(1)').text(), 10),
            extensive: $('div.allocations > div.row > span:nth-of-type(2)').hasClass('yesLabel'),
            allocations: $('div.allocationDetail').map(function(i, alloc){
                return {
                    name: 'Allocation ' + $(this).find('span.allocationNumber').text(),
                    shares: parseInt($(this).find('input[name="shares"]').val(), 0),
                    holders: _.chunk($(this).find('.labelValue').get(), 2)
                        .map(function(chunk){
                            chunk = [$(chunk[0]), $(chunk[1])];
                            var r = {name: _.trim(chunk[0].text()).replace(/\s\s+/g, ' '), address: _.trim(chunk[1].text()).replace('\n', '')};
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

        var documents = [];
        var docIDReg = /javascript:showDocumentDetails\((\d+)\);/;

        $('#documentListPanel .dataList tbody tr').map(function(i, el){
            var $el = $(el);
            if($el.find('td:nth-child(1)').text()){
                documents.push({
                    'date': $el.find('td:nth-child(1)').text(),
                    'documentType': $el.find('td:nth-child(2)').text(),
                    'documentID': $el.find('td:nth-child(2) a').attr('href').match(docIDReg)[1]
                })
            }
            else{
                _.last(documents)['original'] = $el.find('td:nth-child(2) a').attr('href')
            }
        })
        result['documents'] = documents;
        var directors = []
        var formerDirectors = []
        $('.director').map(function(i, el){
            var $el = $(el);
            var obj = {};
            ['fullName', 'residentialAddress', 'appointmentDate', 'ceasedDate'].map(function(f){
                try{
                    obj[f] = _.trim($el.find('label[for="'+f+'"]')[0].parentNode.lastChild.data).replace('\n', '').replace(/\s\s+/g, ' ');
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
