/**
 * Company.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
    attributes: {
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
                as: 'seedCompanyState',
                name: 'seedCompanyStateId'
            }
        });
        Company.belongsTo(CompanyState, {
            as: 'currentCompanyState',
            foreignKey: {
                as: 'currentCompanyState',
                name: 'currentCompanyStateId'
            }
        });
    },
    options: {
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
                    return CompanyState.findById(id[0]['previous_company_state'],
                                                {include: CompanyState.includes.fullNoJunctions(), order: CompanyState.ordering.full()});
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
                    return CompanyState.findById(id[0]['root_company_state'],
                                                {include: CompanyState.includes.fullNoJunctions(), order: CompanyState.ordering.full()});
                });
            },
            getTransactionHistory: function(){
                return sequelize.query("select  company_state_history_json(:id) as transaction",
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
                return sequelize.query("select  company_state_filtered_history_json(:id, :filter::enum_transaction_type[]) as transaction",
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { id: this.currentCompanyStateId, filter: types}})
                .then(function(transactions){
                    if(!transactions.length){
                        throw new sails.config.exceptions.CompanyStateNotFound();
                    }
                    return transactions;
                });
            },



        },
        hooks: {
            afterCreate: [
                function addSeedCompanyState(company) {
                    if(!company.get('seedCompanyStateId')){
                        sails.log.verbose('company.addSeedCompanyState', company.get());
                        return CompanyState.create({
                                transaction: {type: Transaction.types.SEED}
                            }, {include: [{model: Transaction, as: 'transaction'}]})
                        .then(function(state){
                            this.state = state;
                            return company.setSeedCompanyState(state)
                            })
                        .then(function(){
                            return company.setCurrentCompanyState(this.state)
                            })
                        .catch(function(e) {
                            sails.log.error(e);
                        });
                    }else{
                        company.set('currentCompanyStateId', company.get('seedCompanyStateId'));
                        return company.save();
                    }
                }
        ]
    }
}
};