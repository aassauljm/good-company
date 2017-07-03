/**
 * ARConfirmations.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
const uuid = require('uuid');
const Promise = require('bluebird')

module.exports = {
    attributes: {
        year: {
            type: Sequelize.INTEGER
        },
        arData: {
            type: Sequelize.JSON
        }
    },
    associations: function() {
        ARConfirmation.belongsTo(User, {
            as: 'user',
            foreignKey: {
                onDelete: 'cascade',
                as: 'user',
                name: 'userId'
            }
        });
        ARConfirmation.belongsTo(Company, {
            as: 'company',
            foreignKey: {
                onDelete: 'cascade',
                as: 'company',
                name: 'companyId'
            }
        });
        ARConfirmation.hasMany(ARConfirmationRequest, {
            as: 'arConfirmationRequests',
            foreignKey: {
                onDelete: 'cascade',
                as: 'arConfirmation',
                name: 'arConfirmationId'
            }
        });
    },
    options: {
        tableName: 'ar_confirmation',
    }
}