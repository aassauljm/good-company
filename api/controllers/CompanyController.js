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
var moment = require('moment');


module.exports = {

    find: function(req, res) {
        return Company.getNowCompanies(req.user.id)
            .then(result =>{
                return res.ok(result);
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
            return company.getNowCompanyState();
        })
        .then(_state => {
            state = _state;
            companyName = state.get('companyName');
            company.update({'deleted': true});
        })
        .then(() => {
            return ActivityLog.create({
                type: ActivityLog.types.DELETE_COMPANY,
                userId: req.user.id,
                description: `${companyName} Deleted`,
                data: {companyId: company.id}
            });
        })
        .then(() => {
            return res.json({message:  `${companyName} Deleted.`})
        })
    },

    getInfo: function(req, res) {

        Company.findById(req.params.id)
            .then(function(company) {
                this.company = company;
                return company.getNowCompanyState()
            })
            .then(function(companyState) {
                this.companyState = companyState;
                return Promise.all([companyState.fullPopulateJSON(), this.company.hasPendingJob(), this.company.getTransactionsAfter(companyState.id)])
            })
            .spread(function(currentCompanyState, hasPendingJob, futureTransactions) {
                var json = this.companyState.get();
                return res.json({...this.company.toJSON(), currentCompanyState: {...currentCompanyState,  hasPendingJob, futureTransactions}, });
            }).catch(function(err) {
                return res.notFound();
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
            .then(data => company.update({sourceData: data}))
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
                this.company = company;
                return company.getPreviousCompanyState(req.params.generation)
            })
            .then(function(companyState) {
                this.companyState = companyState;
                return Promise.all([companyState.stats(), this.company.hasPendingJob()])
            })
            .spread(function(stats, hasPendingJob) {
                var json = this.companyState.get();
                res.json({companyState: _.merge(json, stats, {hasPendingJob: hasPendingJob})});
            }).catch(function(err) {
                return res.notFound();
            });
    },

   atDate: function(req, res) {
        Company.findById(req.params.id)
            .then(function(company) {
                this.company = company;
                return  company.getDatedCompanyState(moment(req.params.date, 'D-M-YYYY').toDate())
            })
            .then(function(companyState) {
                this.companyState = companyState;
                return Promise.all([companyState.fullPopulateJSON(), this.company.hasPendingJob(), this.company.getTransactionsAfter(companyState.id)])
            })
            .spread(function(currentCompanyState, hasPendingJob, futureTransactions) {
                var json = this.companyState.get();
                return res.json({...this.company.toJSON(), currentCompanyState: {...currentCompanyState,  hasPendingJob, futureTransactions}, });
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
            (company ? company.destroy() : Promise.resolve())
            .then(() => {
                return res.badRequest(err);
            });
        })
        /*.catch(function(err) {
            return res.serverError(err);
        });*/
    },

    importBulk: function(req, res) {
        const args = actionUtil.parseValues(req);
        const list = args.list.filter(f => f);
        const promises = [];
        Promise.all(list.map(list => {
            let resolveJob;
            const complete = new Promise((_resolve, _reject)  => {resolveJob = _resolve});
            promises.push(complete)
            return new Promise((resolve, reject)  => {
                const job = QueueService.importQueue.create('import', {
                    title: 'Bulk Import',
                    userId: req.user.id,
                    query: list,
                    queryType: args.listType
                })
                //.attempts(5)
                //.backoff( {type:'exponential'} )
                .removeOnComplete( true )
                .on('complete', () => {resolveJob(1);})
                .on('failed', () => {resolveJob(0)})
                .ttl(1000 * 60 * 5) // 5 minutes
                .save( function(err){
                   if(err) {
                        reject(err);
                   }
                   else{
                        resolve(job.id);
                    }
                })

            });
        }))
        .then(ids => {
            return res.json({jobIds: ids})
        })
        .catch(err => {
            return res.serverError(err);
        });


        Promise.all(promises)
        .then((results) => {
            sails.log.info('Sending mail')
            return MailService.sendImportComplete(req.user, results.reduce((acc, x) => acc + x, 0), list.length);
        })
        .catch(() => {
            sails.log.error("Failed to send mail");
        })
    },

    transactionBulk: function(req, res) {
        const args = actionUtil.parseValues(req);
        const promises = [];
        const transactionCount = args.transactions.length;
        Promise.all(args.transactions.map(transaction => {
            let company, companyState, shareClass;
            return Company.findById(transaction.companyId)
                .then(function(_company) {
                    company = _company;
                    return PermissionService.isAllowed(company, req.user, 'update', Company.tableName)
                })
                .then(function(){
                    let resolveJob;
                    const complete = new Promise((_resolve, _reject)  => {resolveJob = _resolve});
                    promises.push(complete)
                    return new Promise((resolve, reject)  => {
                        const job = QueueService.transactionQueue.create('transactions', {
                            title: 'Bulk Transaction',
                            userId: req.user.id,
                            companyId: transaction.companyId,
                            transactions: transaction.transactions,
                            companySearchId: `companyId$${transaction.companyId}$`
                        })
                        .removeOnComplete( true )
                        .on('complete', () => {resolveJob(1);})
                        .on('failed', () => { resolveJob(0)})
                        .ttl(1000 * 60 * 5) // 5 minutes
                        .save( function(err){
                           if(err) {
                                reject(err);
                           }
                           else{
                                resolve(job.id);
                            }
                        })

                    });
                })
        }))

        .then((ids) => {
            return res.json({jobIds: ids})
        })
        .catch(e => {
            //return res.forbidden();
            return res.serverError(e);
        });

        Promise.all(promises)
            .then((results) => {
                sails.log.info('Sending mail')
                return MailService.sendTransactionsComplete(req.user, results.reduce((acc, x) => acc + x, 0), transactionCount);
            })
            .catch((e) => {
                sails.log.error("Failed to send mail");
            })

    },


    importPendingHistory: function(req, res){
        let company, companyName;
        Company.findById(req.params.id)
        .then(function(_company){
            company  = _company;
            return company.getNowCompanyState()
        })
        .then(_state => {
            companyName = _state.get('companyName');
            console.log("REQUIRE", !!actionUtil.parseValues(req).requireConfirmation);
            return TransactionService.performInverseAllPending(company, null,  !!actionUtil.parseValues(req).requireConfirmation);
        })
        .then(function(result){
            return res.json(result)
        })
        .then(() => {
            return ActivityLog.create({
                type: ActivityLog.types.COMPLETE_IMPORT_HISTORY,
                userId: req.user.id,
                companyId: company.id,
                description: `Completed ${companyName} History Import`,
                data: {companyId: company.id}
            });
        })
        .catch(function(e){
            return res.serverError(e)
        })
    },

    importPendingHistoryUntilAR: function(req, res){
        let company, companyName;
        Company.findById(req.params.id)
        .then(function(_company){
            company  = _company;
            return company.getNowCompanyState()
        })
        .then(_state => {
            companyName = _state.get('companyName');
            return TransactionService.performInverseAllPendingUntil(company, ((actionSet) => actionSet.data.transactionType === Transaction.types.ANNUAL_RETURN));
        })
        .then(() => {
            return company.getPendingActions()
        })
        .then(pA => {
            if(!pA.length){
                res.json({complete: true});
                return ActivityLog.create({
                    type: ActivityLog.types.COMPLETE_IMPORT_HISTORY,
                    userId: req.user.id,
                    companyId: company.id,
                    description: `Completed ${companyName} History Import`,
                    data: {companyId: company.id}
                });
            }
            else{
                return res.json({complete: false})
            }
        })
        .catch(function(e){
            if(e.context){
                e.context.CHUNK_IMPORT = true;
            }
            return res.serverError(e)
        })
    },


    updatePendingHistory: function(req, res){
        const args = actionUtil.parseValues(req);
        let company ,state;
        Company.findById(req.params.id)
        .then(function(_company){
            company  = _company;
            return company.getNowCompanyState()
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
                as: 'currentCompanyState'},  'companyName' ] ],
            limit: 10
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

    getHistoricHolders: function(req, res) {
        Company.findById(req.params.id)
            .then(company => company.getHistoricHolders())
            .then(function(matchingRecords) {
                res.ok(matchingRecords);
            }).catch(function(err) {
                return res.notFound(err);
            })
    }

};