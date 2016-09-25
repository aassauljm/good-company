/**
 * Company.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
const uuid = require('node-uuid');


module.exports = {
    attributes: {
        deleted: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    },
    associations: function() {
        Company.belongsTo(User, {
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
        // represents foreign data
        Company.belongsTo(SourceData, {
            as: 'sourceData',
            foreignKey: {
                as: 'sourceData',
                name: 'source_data_id'
            }
        });
        Company.belongsTo(SourceData, {
            as: 'historicSourceData',
            foreignKey: {
                as: 'historicSourceData',
                name: 'historic_source_data_id'
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

            getFilteredTransactionHistory: function(types){
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

            getHistoricHolders: function(){
                return sequelize.query("select * from company_persons(:id) where current = FALSE",
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { id: this.currentCompanyStateId}});
            },
            replacePendingActions: function(pendingActions){
                // Find root, and replace next x pendingActions
                let rootState;
                pendingActions.map((pa, i) => {
                    pa.originalId = pa.id;
                    pa.id = uuid.v4();
                    (pa.actions || []).map(a => a.id = uuid.v4())
                    if(i >= 1){
                        pendingActions[i-1].previous_id = pa.id;
                    }
                });

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
            },

            resetPendingActions: function(){
                // TODO, get this from some where else
                // point SEED transaction to original pending_actions_id
                // remove SEED previousCompanyState
                let state, newRoot, pendingActions;
                return this.getHistoricSourceData()
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
                        return this.getSeedCompanyState()
                    })
                    .then(_state => {
                        state = _state;
                        return state.buildPrevious({transaction: null, transactionId: null,
                            pending_historic_action_id: pendingActions[0].id, previousCompanyStateId: null})
                    })
                    .then(function(_newRoot){
                        newRoot = _newRoot
                        return newRoot.save();
                    })
                    .then(() => {
                        return state.update({previousCompanyStateId: newRoot.id})
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