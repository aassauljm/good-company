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
                name: 'owner_id'
            }
        });
        Company.belongsTo(User, {
            foreignKey: {
                onDelete: 'cascade',
                as: 'createdBy',
                name: 'createdBy_id'
            }
        })
        Company.hasMany(Shareholding, {
            as: 'shareholdings',
            foreignKey: {
                name: 'company_id',
                as: 'shareholdings',
                allowNull: false
            }
        });
        console.log(Company.associations)
    },
    options: {
        freezeTableName: false,
        tableName: 'company',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }
};