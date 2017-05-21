/**
 * Company.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
const uuid = require('node-uuid');
const Promise = require('bluebird')

module.exports = {
    attributes: {
        deleted: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        suspended: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    },
    associations: function() {
        Company.belongsTo(User, {
            as: 'owner',
            foreignKey: {
                onDelete: 'cascade',
                as: 'owner',
                name: 'ownerId'
            }
        });
        Company.belongsTo(User, {
            foreignKey: {
            onDelete: 'cascade',
                as: 'createdBy',
                name: 'createdById'
            }
        })
        Company.belongsTo(CompanyState, {
            as: 'seedCompanyState',
            foreignKey: {
                onDelete: 'cascade',
                as: 'seedCompanyState',
                name: 'seedCompanyStateId'
            }
        });
        Company.belongsTo(CompanyState, {
            as: 'currentCompanyState',
            foreignKey: {
                onDelete: 'cascade',
                as: 'currentCompanyState',
                name: 'currentCompanyStateId'
            }
        });
        // represents foreign data, used by import
        Company.belongsTo(SourceData, {
            as: 'sourceData',
            foreignKey: {
                as: 'sourceData',
                name: 'source_data_id'
            }
        });

        // NOT the same as above.  is a list of processed_documents
        Company.belongsTo(SourceData, {
            as: 'historicProcessedDocuments',
            foreignKey: {
                as: 'historicSourceData',
                name: 'historic_source_data_id'
            }
        });
        Company.belongsTo(DocumentList, {
            as: 'docList',
            foreignKey: {
                as: 'docList',
                name: 'doc_list_id'
            }
        });

    },
    options: {
        indexes: [
            {name: 'company_currentCompanyStateId_idx', fields: ['currentCompanyStateId']},
            {name: 'company_ownerId_idx', fields: ['ownerId']},
            {name: 'company_deleted_idx', fields: ['deleted']},
            ],

        freezeTableName: false,
        tableName: 'company',
        classMethods: {
            getNowCompanies: function(userId) {
                return sequelize.query("select user_companies_now(:id)",
                       { type: sequelize.QueryTypes.SELECT,
                        replacements: { id: userId}})
                    .map(r => r.user_companies_now)
            },
            foreignPermissions: function(id) {
                return sequelize.query("select * from get_all_company_permissions_json(:id)",
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { id: id}})
                .then(r => r[0].get_all_company_permissions_json)

            },
            companyPermissionsUser: function(id, catalexId){
                return Promise.all([
                sequelize.query("select * from user_companies_catalex_user_permissions(:id, :catalexId)",
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { id, catalexId}})
                    .then(r => r.map(r => r.user_companies_catalex_user_permissions)),

                    PermissionService.getCatalexUserPermissions(catalexId, 'Company')

                ])
                .spread((companyPermissions, userPermissions) => {
                    return {companyPermissions, userPermissions}
                })
            }
        },
        instanceMethods: {
            getPreviousCompanyState: function(generation){
                return sequelize.query("select previous_company_state(:id, :generation)",
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { id: this.currentCompanyStateId,
                                                generation: generation }})
                .then(function(id){
                    if(!id.length){
                        throw new sails.config.exceptions.CompanyStateNotFound();
                    }
                    return CompanyState.findById(id[0]['previous_company_state'])
                        .then(function(companyState){
                            return companyState.fullPopulate();
                        });
                });
            },

            getNowCompanyState: function(){
                return sequelize.query("select company_now(:id)",
                       { type: sequelize.QueryTypes.SELECT,
                        replacements: { id: this.id}})
                .then(function(id){
                    if(!id.length){
                        throw new sails.config.exceptions.CompanyStateNotFound();
                    }
                    return CompanyState.findById(id[0].company_now)
                        .then(function(companyState){
                            return companyState.fullPopulate();
                        });
                });
            },

            getDatedCompanyState: function(date){
                return sequelize.query("select company_at(:id, :date)",
                       { type: sequelize.QueryTypes.SELECT,
                        replacements: { id: this.id, date: date}})
                .then(function(id){
                    if(!id.length){
                        throw new sails.config.exceptions.CompanyStateNotFound();
                    }
                    return CompanyState.findById(id[0].company_at)
                        .then(function(companyState){
                            return companyState.fullPopulate();
                        });
                });
            },

            getRootCompanyState: function(){
                return sequelize.query("select root_company_state(:id)",
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { id: this.currentCompanyStateId}})
                .then(function(id){
                    if(!id.length){
                        throw new sails.config.exceptions.CompanyStateNotFound();
                    }
                    return CompanyState.findById(id[0]['root_company_state'])
                         .then(function(companyState){
                            return companyState.fullPopulate()
                        });
                });
            },
            getTransactionHistory: function(){
                return sequelize.query("select company_state_history_json(:id) as transaction",
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { id: this.currentCompanyStateId}})
                .then(function(transactions){
                    if(!transactions.length){
                        throw new sails.config.exceptions.CompanyStateNotFound();
                    }
                    return transactions;
                });
            },

            ilteredTransactionHistory: function(types){
                return sequelize.query("select company_state_type_filter_history_json(:id, :filter) as transaction",
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { id: this.currentCompanyStateId, filter: types}})
                .then(function(transactions){
                    if(!transactions.length){
                        throw new sails.config.exceptions.CompanyStateNotFound();
                    }
                    return transactions;
                });
            },
            getShareRegister: function(){
                return sequelize.query("select share_register(:id, '10 year') as share_register",
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { id: this.currentCompanyStateId}})
                .then(function(register){
                    return {shareRegister: register[0].share_register};
                });
            },
            getShareholders: function(){
                return sequelize.query("select historical_holders(:id) as shareholders",
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { id: this.currentCompanyStateId}})
                .then(function(register){
                    return {shareholders: register[0].shareholders};
                });
            },
            createPrevious: function(args){
                return this.getRootCompanyState()
                    .then(function(root){
                        return root.createPrevious(args);
                    });
            },

            getPendingActions: function(){
                return sequelize.query("select * from all_pending_actions(:id)",
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { id: this.currentCompanyStateId}});
            },
            getPendingFutureActions: function(){
                return sequelize.query("select * from all_pending_future_actions(:id)",
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { id: this.currentCompanyStateId}});
            },
            getHistoricHolders: function(){
                return sequelize.query("select * from company_persons(:id) where current = FALSE",
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { id: this.currentCompanyStateId}});
            },
            getAllPersons: function(){
                return sequelize.query("select * from company_persons(:id)",
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { id: this.currentCompanyStateId}});
            },
            replacePendingHistoricActions: function(pendingActions){

                // Find root, and replace next x pendingActions
                let rootState;
                pendingActions.map((pa, i) => {
                    pa.originalId = pa.id;
                    pa.data.id = pa.id = uuid.v4();
                    (pa.data.actions || []).map(a => a.id = uuid.v4());

                    if(i >= 1){
                        pendingActions[i-1].previous_id = pa.id;
                    }
                });
                return sequelize.transaction(() => {
                    return this.getRootCompanyState()
                        .then(_rootState => {
                            rootState = _rootState;
                            return Action.bulkCreate(pendingActions);

                        })
                        .then(() => {
                            return rootState.update({'pending_historic_action_id': pendingActions[0].id})
                        })
                        .then(() => {
                            // HUGE security risk.  Need to validate this pendingAction is owned by this user
                            return Action.update({previous_id: pendingActions[0].id}, {where: {previous_id: pendingActions[0].originalId}, fields: ['previous_id']});
                        })
                    });
            },
            replacePendingFutureActions: function(pendingActions){
                // Find current and replace next x pendingActions
                let currentState;
                pendingActions.map((pa, i) => {
                    pa.originalId = pa.id;
                    pa.data.id = pa.id = uuid.v4();
                    (pa.data.actions || []).map(a => a.id = uuid.v4());

                    if(i >= 1){
                        pendingActions[i-1].previous_id = pa.id;
                    }
                });

                return sequelize.transaction(() => {
                    return this.getCurrentCompanyState()
                        .then(_currentState => {
                            currentState = _currentState;
                            return Action.bulkCreate(pendingActions);

                        })
                        .then(() => {
                            return currentState.update({'pending_future_action_id': pendingActions[0].id})
                        })
                        .then(() => {
                            // HUGE security risk.  Need to validate this pendingAction is owned by this user
                            return Action.update({previous_id: pendingActions[0].id}, {where: {previous_id: pendingActions[0].originalId}, fields: ['previous_id']});
                        })
                    });
            },
            resetPendingActions: function(){
                // point SEED transaction to original pending_actions_id
                // remove SEED previousCompanyState
                let state, newRoot, pendingActions;
                return this.getHistoricProcessedDocuments()
                    .then(dS => {
                        pendingActions = dS.data.map(d => ({data: d}))

                        pendingActions.map((pa, i) => {
                            pa.id = uuid.v4();
                            pa.data.id = pa.id;
                            (pa.data.actions || []).map(a => a.id = uuid.v4())
                            if(i >= 1){
                                pendingActions[i-1].previous_id = pa.id;
                            }
                        })
                        return Action.bulkCreate(pendingActions);
                    })
                    .then(() => {
                        return this.getSeedCompanyState();
                    })
                    .then(_state => {
                        state = _state;
                        return state.buildPrevious({
                            transaction: null,
                            transactionId: null,
                            pending_historic_action_id: pendingActions[0].id,
                            previousCompanyStateId: null}, {newRecords: true})
                    })
                    .then(function(_newRoot){
                        newRoot = _newRoot
                        return newRoot.save();
                    })
                    .then(() => {
                        return state.update({previousCompanyStateId: newRoot.id})
                    });

            },

            reparseResetPendingActions: function(){
                return ImportService.refetchDocuments(this.id)
                    .then(sourceData => {
                        return this.setHistoricSourceData(sourceData);
                    })
                    .then(() => {
                        return this.resetPendingActions();
                    })

            },

            getTransactionsAfter: function(startId){
                return sequelize.query("select future_transaction_range(:startId, :endId)",
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { startId: startId, endId: this.currentCompanyStateId}})
                    .then(results => results.map(r => r.future_transaction_range))
            },

            hasPendingJob: function() {
                return QueueService.searchJobs(`companyId$${this.id}$`)
                    .then(results => !!results.length)
                    .catch(() => false)
            },

            findOrCreateDocList: function(userId){
                let directory, docList;
                return this.getDocList({
                            include: [{
                                model: Document,
                                as: 'documents'
                            }]})
                    .then(dl => {
                        if(!dl){
                            dl = DocumentList.build({documents: []})
                            return dl.save()
                                .then(dl => {
                                    docList = dl;
                                    this.set('doc_list_id', dl.dataValues.id);
                                    this.dataValues.docList = dl;
                                    return this.save();
                                })
                                .then(() => {
                                    return docList;
                                })
                        }
                        return dl;
                    });
            },

            addDocuments: function(documents){
                return this.findOrCreateDocList()
                    .then((docList) => {
                        return docList.addDocuments(documents)
                    })
            },

            findOrCreateTransactionDirectory: function(userId){
                let directory, docList;
                return this.findOrCreateDocList()
                    .then(dl => {
                        directory = _.find(dl.dataValues.documents, d => {
                            return d.filename === 'Transactions' && d.type === 'Directory' && !d.directoryId
                        });
                        if(!directory){
                            return Document.create({
                                type: 'Directory',
                                filename: 'Transactions',
                                ownerId: userId,
                                createdById: userId
                            })
                            .then(dir => {
                                directory = dir;
                                return dl.addDocument(directory);
                            })
                        }
                    })
                    .then(() => {
                        return directory;
                    })
            },
            permissions: function(userId){
                return PermissionService.getPermissions(userId, 'Company', this.id)
            },
            foreignPermissions: function(userId){
                return Company.foreignPermissions(this.id)
            },

            authorities: function(){
                return sequelize.query("select company_co_authorities(:id)",
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { id: this.id}})
                    .spread(result => result.company_co_authorities || [])
            },
            hasAuthority: function(userId){
                return sequelize.query('select allowed FROM co_authority WHERE "companyId" = :companyId AND "userId" = :userId',
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { companyId: this.id, userId}})
                    .spread(result => !result ? null : result.allowed)
            },

            updateSourceData: function(userId){
                const company = this;
                return ScrapingService.fetch(this.sourceData.data.companyNumber)
                .then(ScrapingService.parseNZCompaniesOffice)
                .then(data => ScrapingService.prepareSourceData(data, userId))
                .then(newData => {
                    // currently identifying new source data by comparing data
                        const existing = company.sourceData.data.documents.reduce((acc, d) => {
                            acc[d.documentId] = true;
                            return acc;
                        }, {});
                        let processedDocs, state, directory, nextActionId;
                        const documents = newData.documents.filter(d => !existing[d.documentId]);

                        if(documents.length){
                            return sequelize.transaction(() => {
                                const docData = {documents: documents, companyNumber: company.sourceData.data.companyNumber };
                                return SourceData.create({data:newData})
                                    .then(data => company.setSourceData(data))
                                    .then(() => ScrapingService.getDocumentSummaries(docData))
                                    .then((readDocuments) => {
                                        return ScrapingService.processDocuments(docData, readDocuments);
                                    })
                                    .then((docs) => {
                                        processedDocs = docs.reverse();
                                        return company.getPendingFutureActions()
                                    })
                                    .then(pendingActions => {
                                        if(pendingActions.length){
                                            nextActionId = _.last(pendingActions).id;
                                        }
                                        return Action.bulkCreate(processedDocs.map((p, i) => ({id: p.id, data: p, previous_id: (processedDocs[i+1] || {}).id})));
                                    })
                                    .then((actions) => {
                                        if(!nextActionId){
                                            return company.currentCompanyState.update({'pending_future_action_id': processedDocs[0].id});
                                        }
                                        else{
                                            return Action.update({previous_id: processedDocs[0].id}, {where: {id: nextActionId}})
                                        }
                                    })
                                    .then(() => {
                                        return company.getCurrentCompanyState({include: [{model: DocumentList, as: 'docList'}]})
                                    })
                                    .then(_state => {
                                        state = _state;
                                        return state.getDocumentDirectory();
                                    })
                                    .then(_directory => {
                                        directory = _directory;
                                        return ScrapingService.formatDocuments({documents, companyNumber: company.sourceData.data.companyNumber}, userId)
                                    })
                                    .then(data => {
                                        return Document.bulkCreate(data.docList.documents.map(d => ({...d, directoryId: directory.id})), {returning: true})
                                    })
                                     .then((documents) => {
                                        // mutate the company document list to contain the new docs
                                        return state.docList.addDocuments(documents);
                                    })
                                    .then(() => {
                                        return {sourceDataUpdated: true}
                                    })
                                })
                        }
                        else{
                            return {sourceDataUpdated: false};
                        }
                })
            },

            isFavourite: function(userId){
                return sequelize.query('SELECT EXISTS(SELECT * FROM favourite WHERE "userId" = :userId AND "companyId" = :companyId)',
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { userId, companyId: this.id}})
                    .spread(r => r.exists)
            },

            mergePersons: function({source, targets}){
                return this.getCurrentCompanyState()
                    .then(state => state.mergePersons(source, targets))
                    .then(state => state.save())
                    .then(state => this.setCurrentCompanyState(state).then(() => state))
                    .then(state => state.getPreviousCompanyState())
                    .then(state => {
                        return UtilService.promiseWhile(() => !!state.previousCompanyStateId,
                            () => state.getPreviousCompanyState()
                                .then(state => {
                                    return state.mergePersons(source, targets);
                                })
                                .then(state => state.save())
                                .then(newState => {
                                    return state.setPreviousCompanyState(newState)
                                    .then(() => {
                                        state = newState;
                                    })
                                }))
                    });
                }

        },

        hooks: {
            afterCreate: [
                function addSeedCompanyState(company) {
                    if(company.get('seedCompanyStateId')){
                        company.set('currentCompanyStateId', company.get('seedCompanyStateId'));
                        return company.save();
                    }
                }
        ]
    }
}
};