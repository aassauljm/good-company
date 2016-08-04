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

    destroy: function(req, res) {
        const args = actionUtil.parseValues(req);
        let company ,state, companyName;
        Company.findById(req.params.id)
        .then(function(_company){
            company  = _company;
            return company.getCurrentCompanyState()
        })
        .then(_state => {
            state = _state;
            companyName = state.get('companyName');
            company.update({'deleted': true});
        })
        .then(() => {
            return ActivityLog.create({
                type: ActivityLog.types.UPDATE_PENDING_HISTORY,
                userId: req.user.id,
                description: `${companyName} Deleted`,
                data: {companyId: company.id}
            });
        })
        .then(() => {
            res.json({message:  `${companyName} Deleted.`})
        })
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
                return this.company.currentCompanyState.fullPopulateJSON();
            })
            .then(function(currentCompanyState){
                return res.json({...this.company.toJSON(), currentCompanyState: currentCompanyState});
            })
            .catch(function(err) {
                return res.notFound(err);
            });
    },

    getSourceData: function(req, res) {
        Company.findById(req.params.id, {
                include: [{
                    model: SourceData,
                    as: 'sourceData'
                }]
            })
            .then(function(company) {
                const json = company.toJSON();
                return res.json(json.sourceData);
            })
            .catch(function(err) {
                return res.notFound(err);
            });
    },
    updateSourceData: function(req, res){
        let company;
        Company.findById(req.params.id, {
                include: [{
                    model: SourceData,
                    as: 'sourceData'
                }]
            })
            .then(_company => {
                company = _company;
                return ScrapingService.fetch(company.sourceData.companyNumber)
            })
            .then(ScrapingService.parseNZCompaniesOffice)
            .then(data => company.update({data: data}))
            .then(function(company) {
                const json = company.toJSON();
                return res.json(json.sourceData);
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
                return res.notFound();
            });
    },
    root: function(req, res) {
        Company.findById(req.params.id)
            .then(function(company) {
                return company.getRootCompanyState()
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
        let company;
        ImportService.importCompany(req.params.companyNumber, {
            history: actionUtil.parseValues(req)['history'],
            userId: req.user.id
        })
        /*.then(function(){
            // outside transaction block, because loops with rolledback transactions
            return TransactionService.performInverseAll(company, state);
        })*/
        .then(function(_company) {
            company = _company;
            return res.json(company);
        })
        .catch(sails.config.exceptions.NameExistsException, function(err) {
            (company ? company.destroy() : Promise.resolve())
            .then(() => {
                return res.badRequest(err);
            });
        })
        .catch(function(err) {
             //(company ? company.destroy() : Promise.resolve())
           // .then(() => {
            return res.serverError(err);
            //});
        });
    },



    importPendingHistory: function(req, res){
        Company.findById(req.params.id)
        .then(function(company){
            return TransactionService.performInverseAllPending(company);
        })
        .then(function(result){
            return res.json(result)
        })
        .catch(function(e){
            return res.serverError(e)
        })
    },
    updatePendingHistory: function(req, res){
        const args = actionUtil.parseValues(req);
        let company ,state;
        Company.findById(req.params.id)
        .then(function(_company){
            company  = _company;
            return company.getCurrentCompanyState()
        })
        .then(_state => {
            state = _state;
            return company.replacePendingActions(args.pendingActions);
        })
        .then(() => {
            const companyName = state.get('companyName');
            return ActivityLog.create({
                type: ActivityLog.types.UPDATE_PENDING_HISTORY,
                userId: req.user.id,
                description: `Updated ${companyName} History`,
                data: {companyId: company.id}
            });
        })
        .then(function(result){
            return res.json(result)
        })
        .catch(function(e){
            return res.serverError(e)
        })
    },
    resetPendingHistory: function(req, res){
        let company;
        Company.findById(req.params.id)
            .then(function(_company){
                company  = _company;
                return company.resetPendingActions();
            })
        .then(function(){
            return company.getCurrentCompanyState()
        })
        .then(state => {
            const companyName = state.get('companyName');
            return ActivityLog.create({
                type: ActivityLog.types.RESET_PENDING_HISTORY,
                userId: req.user.id,
                description: `Reset ${companyName} History`,
                data: {companyId: company.id}
            });
        })
        .then(function(result){
            return res.json(result)
        })
        .catch(function(e){
            return res.serverError(e)
        })
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
        ScrapingService.getSearchResults(req.param('query'))
            .then(function(data) {
                return res.json(data);
            }).catch(function(err) {
                return res.negotiate(err);
            });
    },
    lookupOwn: function(req, res) {
        Company.findAll({
            where: {
                ownerId: req.user.id,
                deleted: false,
            },
            include: [{
                model: CompanyState,
                as: 'currentCompanyState',
                where: {
                    companyName: {
                      $ilike: `%${req.param('query')}%`
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
        ImportService.checkNameCollision(req.user.id, data)
            .then(function(){
                return res.ok({})
            })
            .catch(function(err){
                return res.badRequest(err);
            })
    },
    recentActivity: function(req, res) {
        ActivityLog.findAll({
            where: {companyId: req.params.id},
            order: [['createdAt', 'DESC']],
            limit: 10
        })
        .then(activities => res.json(activities));
    },
    getPendingHistoricActions: function(req, res) {
        Company.findById(req.params.id)
        .then(company => company.getPendingActions())
       .then(function(matchingRecords) {
            res.ok(matchingRecords);
        }).catch(function(err) {
            return res.notFound(err);
        })
    },

};