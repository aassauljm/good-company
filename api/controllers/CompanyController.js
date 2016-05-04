"use strict";
/**
 * CompanyController
 *
 * @description :: Server-side logic for managing companies
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Promise = require('bluebird');
var _ = require('lodash');
var actionUtil = require('sails-hook-sequelize-blueprints/actionUtil');

function checkNameCollision(ownerId, data) {
    return Company.findAll({
            where: {
                ownerId: ownerId
            },
            include: [{
                model: CompanyState,
                as: 'currentCompanyState',
                where: {
                    companyName: data.companyName //and not deleted
                }
            }]
        })
        .then(function(results) {
            if (results.length) {
                throw new sails.config.exceptions.CompanyImportException('A company with that name already exists');
            }
        })
}


module.exports = {
    find: function(req, res) {
        var Model = actionUtil.parseModel(req);
        Model.findAll({
            where: actionUtil.parseCriteria(req),
            limit: actionUtil.parseLimit(req),
            offset: actionUtil.parseSkip(req),
            order: actionUtil.parseSort(req),
            include: [{
                model: CompanyState,
                as: 'currentCompanyState'
            }]
        }).then(function(matchingRecords) {
            res.ok(matchingRecords.map(x => x.toJSON()));
        }).catch(function(err) {
            return res.notFound(err);
        });
    },

    getInfo: function(req, res) {
        Company.findById(req.params.id, {
                include: [{
                    model: CompanyState,
                    as: 'currentCompanyState'
                }]
            })
            .then(function(company) {
                this.company = company;
                return this.company.currentCompanyState.fullPopulate();
            })
            .then(function(){
                return this.company.currentCompanyState.stats()
            })
            .then(function(stats){
                const json = this.company.toJSON();
                json.currentCompanyState = _.merge(json.currentCompanyState, stats);
                return res.json(json);
            })
            .catch(function(err) {
                return res.notFound(err);
            });
    },
    history: function(req, res) {
        Company.findById(req.params.id)
            .then(function(company) {
                return company.getPreviousCompanyState(req.params.generation)
            })
            .then(function(companyState) {
                this.companyState = companyState;
                return companyState.stats();
            })
            .then(function(stats) {
                var json = this.companyState.get();
                res.json({companyState: _.merge(json, stats)});
            }).catch(function(err) {
                return res.badRequest(err);
            });
    },
    transactionHistory: function(req, res) {
        Company.findById(req.params.id)
            .then(function(company) {
                return company.getTransactionHistory()
            })
            .then(function(transactions) {
                res.json({transactions: transactions});
            }).catch(function(err) {
                return res.badRequest(err);
            });
    },
    issueHistory: function(req, res) {
        Company.findById(req.params.id)
            .then(function(company) {
                return company.getFilteredTransactionHistory(['ISSUE']);
            })
            .then(function(transactions) {
                res.json({transactions: transactions});
            }).catch(function(err) {
                return res.badRequest(err);
            });
    },
    shareRegister: function(req, res) {
        Company.findById(req.params.id)
            .then(function(company) {
                return company.getShareRegister();
            })
            .then(function(holders) {
                res.json(holders);
            }).catch(function(err) {
                return res.badRequest(err);
            });
    },
    shareholders: function(req, res) {
        Company.findById(req.params.id)
            .then(function(company) {
                return company.getShareholders();
            })
            .then(function(holders) {
                res.json(holders);
            }).catch(function(err) {
                return res.badRequest(err);
            });
    },
    interestsRegister: function(req, res) {
        Company.findById(req.params.id, {
                include: [{
                    model: CompanyState,
                    as: 'currentCompanyState',
                    include: CompanyState.includes.iRegister(),
                }],
                order: CompanyState.ordering.iRegister().map((e) => [{
                    model: CompanyState,
                    as: 'currentCompanyState'
                }, ...e])
            })
            .then(function(company) {
                res.json((company.currentCompanyState.iRegister||{}).entries || []);
            }).catch(function(err) {
                return res.badRequest(err);
            });
    },
    import: function(req, res) {
        // for now, just companies office
        let data, company, state, processedDocs;
        return sequelize.transaction(function(t){
            return ScrapingService.fetch(req.params.companyNumber)
                .then(ScrapingService.parseNZCompaniesOffice)
                .tap(checkNameCollision.bind(null, req.user.id))
                .then((_data) => {
                    data = _data;
                    return ScrapingService.populateDB(data, req.user.id);
                })
                .then(function(_company) {
                    company = _company;
                    if(actionUtil.parseValues(req)['history'] !== false){
                        return ScrapingService.getDocumentSummaries(data)
                        .then((readDocuments) => ScrapingService.processDocuments(data, readDocuments))
                        .then(function(_processedDocs) {
                            processedDocs = _processedDocs;
                            return company.createPrevious();
                        })
                        .then(function(){
                            return company.getCurrentCompanyState();
                        })
                        .then(function(_state){
                            state = _state;
                            return Actions.create({actions: processedDocs.filter(p=>p.actions)});
                        })
                        .then(function(actions){
                            state.set('historical_action_id', actions.id);
                            return state.save();
                        })
                        .then(() => {
                            return ActivityLog.create({
                                type: ActivityLog.types.IMPORT_COMPANY,
                                user: req.user,
                                description: `Imported ${state.companyName} from Companies Office.`,
                                data: {companyId: company.id
                                }
                            });
                        })
                    }
                })
        })
        .then(function(){
            // outside transaction block, because loops with rolledback transactions
            if(processedDocs){
                sails.log.info('Applying inverse actions for ' + processedDocs.length + ' documents');
                return TransactionService.performInverseAll(processedDocs, company, state);
            }
        })
        .then(function() {
            return res.json(company);
        })
        .catch(sails.config.exceptions.CompanyImportException, function(err) {
            (company ? company.destroy() : Promise.resolve())
            .then(() => {
                return res.badRequest(err);
            });
        })
        .catch(function(err) {
             (company ? company.destroy() : Promise.resolve())
            .then(() => {
                return res.serverError(err);
            });
        });
    },
    create: function(req, res) {
        var data = actionUtil.parseValues(req);
        Company.create({
                ownerId: req.user.id,
                creatorId: req.user.id,
                seedCompanyState: data
            }, {
                include: [{
                    model: CompanyState,
                    as: 'seedCompanyState'
                }]
            })
            .then(function(newInstance) {
                return res.created(newInstance);
            }).catch(function(err) {
                return res.negotiate(err);
            });
    },
    lookup: function(req, res) {
        ScrapingService.getSearchResults(req.params.query)
            .then(function(data) {
                return res.json(data);
            }).catch(function(err) {
                return res.negotiate(err);
            });
    },
    lookupOwn: function(req, res) {
        Company.findAll({
            where: {
                ownerId: req.user.id
            },
            include: [{
                model: CompanyState,
                as: 'currentCompanyState',
                where: {
                    companyName: {
                      $ilike: `%${req.params.query}%`
                    }
                }
            }],
            order: [ [ {
                model: CompanyState,
                as: 'currentCompanyState'},  'companyName' ] ]
        })
        .then(function(matchingRecords) {
            res.json(matchingRecords.map((x) => ({
                companyName: x.currentCompanyState.companyName,
                companyNumber: x.currentCompanyState.companyNumber,
                nzbn: x.currentCompanyState.nzbn,
                id: x.id
            })));
        })
    },
    validate: function(req, res){
        var data = actionUtil.parseValues(req);
        checkNameCollision(req.user.id, data)
            .then(function(){
                return res.ok({})
            })
            .catch(function(err){
                return res.badRequest(err);
            })
    }
};