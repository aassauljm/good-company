/**
 * Company.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
    attributes: {
        historicalActions: {
            type: Sequelize.JSON
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
                return sequelize.query("select share_register(:id) as share_register",
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
            createPrevious: function(){
                return this.getRootCompanyState()
                    .then(function(root){
                        return root.createPrevious();
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