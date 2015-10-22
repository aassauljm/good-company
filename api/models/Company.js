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
        Company.belongsTo(Transaction, {
            as: 'seedTransaction',
            foreignKey: {
                as: 'seedTransaction',
                name: 'seedTransactionId'
            }
        });
        Company.belongsTo(Transaction, {
            as: 'currentTransaction',
            foreignKey: {
                as: 'currentTransaction',
                name: 'currentTransactionId'
            }
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'company',
        classMethods: {
        },
        instanceMethods: {
            getPreviousTransaction: function(generation){
                return sequelize.query("select previous_transaction(:id, :generation)",
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { id: this.currentTransactionId,
                                                generation: generation }})
                .then(function(id){
                    if(!id.length){
                        throw new sails.config.exceptions.TransactionNotFound();
                    }
                    return Transaction.findById(id[0]['previous_transaction'],
                                                {include: Transaction.includes.fullNoJunctions()});
                });
            }
        },
        hooks: {
            afterCreate: [
                function addSeedTransaction(company) {
                    sails.log.verbose('company.addSeedTransaction', company.get());
                    return Transaction.create({
                            type: Transaction.types.SEED
                        })
                    .then(function(transaction){
                        this.transaction = transaction;
                        return company.setSeedTransaction(transaction)
                        })
                    .then(function(){
                        return company.setCurrentTransaction(this.transaction)
                        })
                    .catch(function(e) {
                        sails.log.error(e);
                    });
                }
        ]
    }
}
};