/**
 * Company.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
var months = Sequelize.ENUM('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');


module.exports = {
    attributes: {
        companyName: {
            type: Sequelize.TEXT,
            unique: true,
            index: true,
            allowNull: false,
            validate: {
                min: 1
            }
        },
        companyNumber: {
            type: Sequelize.TEXT
        },
        nzba: {
            type: Sequelize.TEXT
        },
        incorporationDate: {
            type: Sequelize.DATE
        },
        companyStatus: {
            type: Sequelize.TEXT
        },
        entityType: {
            type: Sequelize.TEXT
        },
        constiutionFiled: {
            type: Sequelize.BOOLEAN
        },
        arFilingMonth: {
            type: months
        },
        fraReportingMonth: {
            type: months
        },
        registeredCompanyAddress: {
            type: Sequelize.TEXT
        },
        addressForShareRegister: {
            type: Sequelize.TEXT
        },
        addressForService: {
            type: Sequelize.TEXT
        },
        ultimateHoldingCompany: {
            type: Sequelize.BOOLEAN
        },
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
            }
        },
        hooks: {
            afterCreate: [
                function addSeedCompanyState(company) {
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
                }
        ]
    }
}
};