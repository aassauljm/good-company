/**
 * CompanyController
 *
 * @description :: Server-side logic for managing companies
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Promise = require('bluebird');
var _ = require('lodash');


module.exports = {
    getInfo: function(req, res) {
        Company.findById(req.params.id, {
                include: [{
                    model: CompanyState,
                    as: 'currentCompanyState',
                    include: CompanyState.includes.fullNoJunctions(),
                }],
                order: CompanyState.ordering.full().map((e) => [{model: CompanyState, as: 'currentCompanyState'}, ...e])
            })
            .then(function(company){
                this.company = company;
                return company.currentCompanyState.stats();
            })
            .then(function(stats){
                res.json(_.merge({}, this.company.get(), stats))
            });
    },
    history: function(req, res){
        Company.findById(req.params.id)
            .then(function(company){
                return company.getPreviousCompanyState(req.params.generation)
            })
            .then(function(companyState){
                this.companyState = companyState;
                return companyState.stats();
            })
            .then(function(stats){
                res.json(_.merge({companyState: this.companyState.get()}, stats))
            })
    },
    import: function(req, res){
        var data, company;
        ScrapingService.fetch(req.params.companyNumber)
            .then(ScrapingService.parseNZCompaniesOffice)
            .then(function(_data){
                data = _data;
                data.ownerId = req.user.id;
                data.creatorId = req.user.id;
                return data;
            })
            .then(ScrapingService.populateDB)
            .then(function(_company){
                company = _company;
                return ScrapingService.getDocumentSummaries(data)
            })
            .each(ScrapingService.processDocument)
            .then(function(readDocuments){
                return Promise.each(data.documents, function(doc){
                    var docData = _.find(readDocuments, {documentId: doc.documentId});
                    return ScrapingService.processDocument(doc, docData)
                });
            })
            .then(function(actions){
                return Promise.each(actions, function(action){
                    ScrapingService.populateHistory(action, company);
                })
            })
            .then(function(){
                return res.ok(company);
            })
    }
};