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
        effectiveDate: {
            type: Sequelize.DATE,
        }
    },
    associations: function() {
        AnnualReturn.belongsTo(Company, {
            as: 'company',
            foreignKey: {
                onDelete: 'cascade',
                as: 'company',
                name: 'companyId'
            }
        });
        AnnualReturn.belongsTo(Document, {
            as: 'document',
            foreignKey: {
                name: 'documentId'
            }
        });
    },
    options: {
        tableName: 'annual_return',
        freezeTableName: false,
        indexes: [{
            name: 'annual_return_company_id_idx',
            fields: ['companyId']
        }]
    }
}