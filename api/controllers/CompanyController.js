/**
 * CompanyController
 *
 * @description :: Server-side logic for managing companies
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Promise = require('bluebird');
var _ = require('lodash');
var actionUtil = require('sails-hook-sequelize-blueprints/actionUtil');

module.exports = {
    find: function(req, res){
      var Model = actionUtil.parseModel(req);
      Model.findAll({
        where: actionUtil.parseCriteria(req),
        limit: actionUtil.parseLimit(req),
        offset: actionUtil.parseSkip(req),
        order: actionUtil.parseSort(req),
        include: [{model: CompanyState, as: 'currentCompanyState'}]
      }).then(function(matchingRecords) {
        res.ok(matchingRecords);
      }).catch(function(err){
        return res.serverError(err);
      });
    },

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
            }).catch(function(err){
                return res.serverError(err);
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
            }).catch(function(err){
        return res.serverError(err);
      });
    },
    import: function(req, res){
        // for now, just companies office
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
            .then(function(readDocuments){
                return Promise.each(data.documents, function(doc){
                    var docData = _.find(readDocuments, {documentId: doc.documentId});
                    return ScrapingService.processDocument(doc, docData)
                });
            })
            .then(function(actions){
                sails.log.verbose('Processing '+actions.length+' actions');
                return Promise.each(actions, function(action){
                    ScrapingService.populateHistory(action, company);
                })
            })
            .then(function(){
                return res.json(company);
            })
            .catch(function(err){
                sails.log.error(err)
                return res.serverError(err);
            });
    },
    create: function(req, res){
        var data = actionUtil.parseValues(req);
        Company.create({
            ownerId: req.user.id,
            creatorId: req.user.id,
            seedCompanyState: data},
            {include: [{model: CompanyState, as: 'seedCompanyState'}]})
        .then(function(newInstance) {
            return res.created(newInstance);
        }).catch(function(err){
            return res.negotiate(err);
        });
    },
    lookup: function(req, res){
        ScrapingService.getSearchResults(req.params.query)
            .then(function(data){
                return res.json(data);
            }).catch(function(err){
            return res.negotiate(err);
        });
    }
};