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
var fs = Promise.promisifyAll(require("fs"));

function filterUnSubmittedTransactions(transactions){
    const interestedTransactions = {
        [Transaction.types.NEW_DIRECTOR]: true,
        [Transaction.types.REMOVE_DIRECTOR]: true,
        [Transaction.types.UPDATE_DIRECTOR]: true,
    }
    return transactions.filter(t => interestedTransactions[t.transaction.type] && t.transaction.data && !t.transaction.data.documentId && !t.transaction.data.submitted);
}


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

    checkCompaniesOffice: function(req, res) {
        Company.findById(req.params.id)
            .then(function(company) {
                this.company = company;
                return company.getNowCompanyState()
            })
            .then(function(companyState) {
                return ImportService.checkCompaniesOfficeForUpdate(this.company, companyState)
            })
            .then(result => {
                return res.json(result);
            })
            .catch(function(err) {
                return res.serverError(err);
            });
    },

    getInfo: function(req, res) {
        Company.findById(req.params.id, {include: [{model: User, as: 'owner'}]})
            .then(function(company) {
                this.company = company;
                return company.getNowCompanyState()
            })
            .then(function(companyState) {
                this.companyState = companyState;
                return Promise.all([companyState.fullPopulateJSON(),
                                   this.company.hasPendingJob(),
                                   this.company.getTransactionsAfter(companyState.id),
                                   this.company.permissions(req.user.id),
                                   this.company.authorities(),
                                   this.company.hasAuthority(req.user.id),
                                   this.company.getDeadlines()
                                   ])
            })
            .spread(function(currentCompanyState, hasPendingJob, futureTransactions, permissions, authorities, authority, deadlines) {
                return res.json({...this.company.toJSON(),  currentCompanyState: {
                    ...currentCompanyState,
                    hasPendingJob,
                    futureTransactions,
                    dateOfState: new Date(),
                    permissions,
                    authorities,
                    authority,
                    deadlines }});
            }).catch(function(err) {
                return res.notFound();
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
                return Promise.all([companyState.stats(),
                                   this.company.hasPendingJob(),
                                   this.company.permissions(req.user.id),
                                   this.company.authorities(),
                                   this.company.hasAuthority(req.user.id),
                                   this.company.getDeadlines()
                                   ])
            })
            .spread(function(stats, hasPendingJob,  permissions, authorities, authority, deadlines) {
                var json = this.companyState.get();
                res.json({companyState: _.merge(json, stats, {hasPendingJob, permissions, authorities, authority, deadlines})});
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
                return Promise.all([companyState.fullPopulateJSON(),
                                   this.company.hasPendingJob(),
                                   this.company.getTransactionsAfter(companyState.id),
                                   this.company.permissions(req.user.id),
                                   this.company.authorities(),
                                   this.company.hasAuthority(req.user.id),
                                   this.company.getDeadlines()])
            })
            .spread(function(currentCompanyState, hasPendingJob, futureTransactions, permissions, authorities, authority, deadlines) {
                var json = this.companyState.get();
                return res.json({...this.company.toJSON(),  currentCompanyState: {
                    ...currentCompanyState,
                    hasPendingJob,
                    futureTransactions,
                    dateOfState: new Date(),
                    permissions,
                    authorities,
                    authority,
                    deadlines }});
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
                return res.json({currentSourceData: json.sourceData});
            })
            .catch(function(err) {
                return res.notFound(err);
            });
    },

    getDocuments: function(req, res) {
        Company.findById(req.params.id, {
                include: [{
                     model: DocumentList,
                     as: 'docList',
                     include: [
                        {
                            through: {attributes: []},
                            model: Document,
                            as: 'documents'
                        }
                     ]
                }]
            })
            .then(function(company) {
                const json = company.docList ? company.docList.toJSON() : {documents: []};
                return res.json(json);
            })
            .catch(function(err) {
                return res.notFound(err);
            });
    },

    createDocument: function(req, res) {
        let args = actionUtil.parseValues(req);
        let directory, directoryId, company, companyName, docList;
        args = args.json ? {...args, ...JSON.parse(args.json), json: null} : args;
        return req.file('documents').upload(function(err, uploadedFiles){
            return Company.findById(req.params.id)
                .then(function(_company){
                    company  = _company;
                    return company.getNowCompanyState();
                })
                .then(_state => {
                    companyName = _state.get('companyName');
                    return company.findOrCreateDocList();
                })
                .then(_docList => {
                    docList = _docList;
                    if(args.newDirectory){
                        return Document.create({
                            filename: args.newDirectory,
                            createdById: req.user.id,
                            ownerId: req.user.id,
                            type: 'Directory',
                            directoryId: args.directoryId,
                            userUploaded: true
                        })
                        .then(doc => {
                            directory = doc;
                            directoryId = doc.id;
                            return docList.addDocuments(doc);
                        })
                    }
                    else{
                        directoryId = args.directoryId;
                    }
                })
                .then(() => {
                    return Promise.map(uploadedFiles || [], f => {
                        return fs.readFileAsync(f.fd)
                            .then(readFile => {
                                return Document.create({
                                    filename: f.filename,
                                    createdById: req.user.id,
                                    ownerId: req.user.id,
                                    type: f.type,
                                    directoryId: directoryId,
                                    userUploaded: true,
                                    documentData: {
                                        data: readFile,
                                    }
                                }, { include: [{model: DocumentData, as: 'documentData'}]});
                        });
                    })
                    .then(uploaded => {
                        return docList.addDocuments(uploaded);
                    })
                })
                .then(() => {
                    return res.json({message: ['Documents Created']})
                })
                .then(() => {
                    return ActivityLog.create({
                        type: args.newDirectory ? ActivityLog.types.CREATE_DIRECTORY : ActivityLog.types.UPLOAD_DOCUMENT,
                        userId: req.user.id,
                        companyId: company.id,
                        description: `Added documents to ${companyName} `,
                        data: {companyId: company.id}
                    });
                })
                .catch(function(err) {
                    return res.serverError(err);
                })
            });
    },


    updateSourceData: function(req, res){
        let company, companyName;
        Company.findById(req.params.id, {
                include: [{
                    model: SourceData,
                    as: 'sourceData'
                },{
                    model: CompanyState,
                    as: 'currentCompanyState'
                }]
            })
            .then(_company => {
                company = _company;
                return company.getNowCompanyState();
            })
            .then(_state => {
                companyName = _state.get('companyName');
                return company.updateSourceData(req.user.id)
            })
            .tap((result) => {
                if(result.sourceDataUpdated){
                     return ActivityLog.create({
                        type:  ActivityLog.types.UPDATE_SOURCE_DOCUMENTS,
                        userId: req.user.id,
                        companyId: company.id,
                        description: `Retrieved documents from the Companies Office for ${companyName}`,
                        data: {companyId: company.id}
                    });
                 }
            })
            .then(r => res.json(r))
            .catch(function(err) {
                sails.log.error(err);
                return res.notFound(err);
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

    transactionsUnsubmitted: function(req, res) {
        Company.findById(req.params.id)
            .then(function(company) {
                return company.getTransactionHistory()
            })
            .then(function(transactions) {
                transactions = filterUnSubmittedTransactions(transactions);
                res.json({unSubmittedTransactions: transactions});

            }).catch(function(err) {
                console.log(err)
                return res.badRequest(err);
            });
    },

    transactionsSubmit: function(req, res) {
        Company.findById(req.params.id)
            .then(function(company) {
                return company.getTransactionHistory()
            })
            .then(function(transactions) {
                let args = actionUtil.parseValues(req);
                transactions = filterUnSubmittedTransactions(transactions).filter(t => args.transactionIds.indexOf(t.transaction.id) >= 0);
                res.json({unSubmittedTransactions: transactions});
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
                .removeOnComplete( true )
                .on('complete', () => {resolveJob(1);})
                .on('failed', () => {resolveJob(0)})
                .ttl(1000 * 60 * 4) // 4 minutes
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
                        .ttl(1000 * 60 * 4) // 4 minutes
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

    importPendingFuture: function(req, res){
        let company, companyName;
        Company.findById(req.params.id)
        .then(function(_company){
            company  = _company;
            return company.getCurrentCompanyState()
        })
        .then(_state => {
            companyName = _state.get('companyName');
            return TransactionService.performAllPending(company);
        })
        .then(function(result){
            return res.json(result)
        })
        .then(() => {
            return ActivityLog.create({
                type: ActivityLog.types.COMPLETE_IMPORT_HISTORY,
                userId: req.user.id,
                companyId: company.id,
                description: `Completed ${companyName} Reconciliation`,
                data: {companyId: company.id}
            });
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
            return company.getNowCompanyState()
        })
        .then(_state => {
            state = _state;
            return company.replacePendingHistoricActions(args.pendingActions);
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

    updatePendingFuture: function(req, res){
        const args = actionUtil.parseValues(req);
        let company ,state;
        Company.findById(req.params.id)
        .then(function(_company){
            company  = _company;
            return company.getNowCompanyState()
        })
        .then(_state => {
            state = _state;
            return company.replacePendingFutureActions(args.pendingActions);
        })
        .then(() => {
            const companyName = state.get('companyName');
            return ActivityLog.create({
                type: ActivityLog.types.UPDATE_PENDING_HISTORY,
                userId: req.user.id,
                description: `Updated ${companyName} Pending Transactions`,
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

    reparseResetPendingHistory: function(req, res){
        let company;
        Company.findById(req.params.id)
            .then(function(_company){
                company  = _company;
                return company.reparseResetPendingActions();
            })
        .then(function(){
            return company.getCurrentCompanyState()
        })
        .then(state => {
            const companyName = state.get('companyName');
            return ActivityLog.create({
                type: ActivityLog.types.RESET_PENDING_HISTORY,
                userId: req.user.id,
                description: `Refetched and Reset ${companyName} History`,
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
        ActivityLog.query(null, req.params.id, 10)
        .then(activities => res.json(activities));
    },

    recentActivityFull: function(req, res) {
         ActivityLog.query(null, req.params.id)
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
    getPendingFutureActions: function(req, res) {
        Company.findById(req.params.id)
        .then(company => company.getPendingFutureActions())
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
    },

    getAllPersons: function(req, res) {
        Company.findById(req.params.id)
            .then(company => company.getAllPersons())
            .then(function(matchingRecords) {
                res.ok(matchingRecords);
            }).catch(function(err) {
                return res.notFound(err);
            })
    },

    getForeignPermissions: function(req, res) {
        Company.foreignPermissions(req.params.id)
            .then(r => res.json(r))
            .catch(function(err){
                return res.badRequest(err);
            })
    },

    addForeignPermissions: function(req, res) {
        var data = actionUtil.parseValues(req);
        Company.findById(req.params.id)
            .then(company => {
                return Promise.map(data.permissions, permission => {
                    return PermissionService.addPermissionCatalexUser(data.catalexId, company, permission, data.allow, true)
                });
            })
            .then(r => res.json({message: 'Permissions Updated'}))
            .catch(function(err){
                return res.badRequest(err);
            })
    },

    removeForeignPermissions: function(req, res) {
        var data = actionUtil.parseValues(req);
        Company.findById(req.params.id)
            .then(company => {
                return Promise.map(data.permissions, permission => {
                    return PermissionService.removePermissionCatalexUser(data.catalexId, company, permission, data.allow, true)
                });
            })
            .then(r => res.json({message: 'Permissions Updated'}))
            .catch(function(err){
                return res.badRequest(err);
            })
    },


    companyPermissionsCatalexUser: function(req, res) {
        return Company.companyPermissionsUser(req.user.id, req.params.catalexId)
            .then(result =>{
                return res.ok(result);
            }).catch(function(err) {
                return res.badRequest(err);
            });
    },

    updateCompanyPermissionsCatalexUser: function(req, res) {
        const permissionChanges = actionUtil.parseValues(req).permissionChanges;
        return Promise.map(permissionChanges, permissionChange => {
            return Company.findById(permissionChange.companyId)
            .then(company => {
                return PermissionService.isAllowed(company, req.user, 'update', 'Company')
                .then(allowed => {
                    if(allowed){
                        return Promise.map(permissionChange.permissions, permission => {
                            if(permissionChange.addOrRemove === 'add_permissions'){
                                return PermissionService.addPermissionCatalexUser(req.params.catalexId, company, permission, permissionChange.allow, true);
                            }
                            else{
                                return PermissionService.removePermissionCatalexUser(req.params.catalexId, company, permission, permissionChange.allow, true)
                            }
                        });
                    }
                })
            })
        })
        .then(result =>{
            return res.json({message: 'Permissions Updated'});
        }).catch(function(err) {
            return res.badRequest(err);
        });
    },


    inviteUserWithPermissions: function(req, res) {
        var data = actionUtil.parseValues(req), company, state;
        Company.findById(req.params.id)
            .then(function(_company){
                company  = _company;
                return company.getNowCompanyState();
            })
            .then(_state => {
                state = _state;
                const userData = {name: data.name, email: data.email, senderName: req.user.username, companyName: state.companyName}
                return CatalexUsersService.findOrCreateUserAndNotify(userData)
            })
            .then((user) => {
                console.log(data.permissions, 'huh')
                return Promise.map(data.permissions, permission => {

                    return PermissionService.addPermissionCatalexUser(user.catalexId, company, permission, data.allow, true)
                });
            })
            .then(r => res.json({message: 'Permissions Updated'}))
            .catch(function(err){
                return res.badRequest(err);
            })
    },


    findPerson: function(req, res) {
        return sequelize.query("select find_persons(:id, :personId)",
                       { type: sequelize.QueryTypes.SELECT,
                        replacements: { id: userId, personId: parseInt(req.params.personId, 10)}})
            .then(r => res.json(r[0].find_persons))
            .catch(function(err){
                return res.badRequest(err);
            })
    },

    mergePersons: function(req, res) {
        const data = actionUtil.parseValues(req);
        let company, originalState;
        sequelize.transaction(() => {
            return Company.findById(req.params.id)
                .then(function(_company){
                    company  = _company;
                    originalState = company.currentCompanyStateId;
                    return company.mergePersons(data);
                })
                .then(function(){
                    return company.getNowCompanyState();
                })
                .then((state) => {
                    return ActivityLog.create({
                        type: ActivityLog.types.MERGE_PERSONS,
                        userId: req.user.id,
                        description: `Merge perons into ${data.source.name}`,
                        data: {companyId: company.id, originalStateId: originalState}
                    });
                })
            })
            .then(r => res.json({message: 'Persons Merged'}))
            .catch(function(err){
                return res.badRequest(err);
            })
    },


    mergeCompaniesOffice: function(req, res) {
        let company;
        Company.findById(req.params.id, {
            include: [{
                    model: SourceData,
                    as: 'sourceData'
                }]
            })
            .then(function(_company){
                company  = _company;
                return company.getDatedCompanyState(company.sourceData.createdAt)
            })
            .then(state => {
                return MbieSyncService.merge(req.user, company, state);
            })
            .then(result =>{
                return res.ok(result);
            }).catch(function(err) {
                return res.badRequest(err);
            });
    },

    requestARSummary: function(req, res) {
        let company;
        Company.findById(req.params.id)
            .then(function(_company){
                company  = _company;
                return company.getNowCompanyState();
            })
            .then(state => {
                return MbieSyncService.arSummary(req.user, company, state);
            })
            .then(result =>{
                return res.json(result);
            })
            .catch(sails.config.exceptions.UserNotConnected, function(err) {
                return res.badRequest(err);
            })
            .catch(function(err) {
                sails.log.error(err)
                return res.badRequest({message:  'Could not get Annual Return from the Companies Office. Please try again later.'});
            });
    },

    submitAR: function(req, res) {
        let company, companyName;
        const values = actionUtil.parseValues(req);;

        Company.findById(req.params.id, {
                include: [{
                    model: SourceData,
                    as: 'sourceData'
                },{
                    model: CompanyState,
                    as: 'currentCompanyState'
                }]
            })
            .then(function(_company){
                company  = _company;
                return company.getNowCompanyState();
            })
            .then(state => {
                companyName = state.companyName;
                return MbieSyncService.arSubmit(req.user, company, state, values);
            })
            .then(() => {
                return ActivityLog.create({
                    type: ActivityLog.types.ANNUAL_RETURN_SUBMITTED,
                    userId: req.user.id,
                    description: `${companyName} Annual Return Submitted`,
                    companyId: company.id,
                    data: {companyId: company.id}
                });
            })
            .tap(result => {
                return company.updateSourceData(req.user.id);
            })
            .then(result =>{
                return res.json(result);
            })
            .catch(sails.config.exceptions.COUnauthorised, function(err) {
                return res.badRequest({message: 'You are not authorized to submit an Annual Return for this company'});
            })
            .catch(sails.config.exceptions.COFailValidation, function(err) {
                return res.badRequest({message: err.message});
            })
            .catch(function(err) {
                sails.log.error(err)
                return res.badRequest({message:  'Could not submit Annual Return'});
            });
    },

    updateUserAuthority: function(req, res) {
        let company;
        Company.findById(req.params.id)
            .then(function(_company){
                company  = _company;
                return company.getNowCompanyState();
            })
            .then(state => {
                return MbieSyncService.updateAuthority(req.user, company, state);
            })
            .then(result =>{
                return res.json({hasAuthority: result});
            }).catch(function(err) {
                return res.badRequest(err);
            });
    }
};