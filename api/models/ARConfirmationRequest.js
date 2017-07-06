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
        code: {
            type: Sequelize.TEXT
        },
        feedback: {
            type: Sequelize.TEXT
        },
        email: {
            type: Sequelize.TEXT
        },
        name: {
            type: Sequelize.TEXT
        },
        confirmed: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        deleted: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    },
    associations: function() {

        ARConfirmationRequest.belongsTo(ARConfirmation, {
            as: 'arConfirmation',
            foreignKey: {
                onDelete: 'cascade',
                as: 'arConfirmation',
                name: 'arConfirmationId'
            }
        });
        ARConfirmationRequest.belongsTo(Person, {
            as: 'person',
            foreignKey: {
                onDelete: 'cascade',
                as: 'person',
                name: 'personId'
            }
        });

    },
    options: {
        tableName: 'ar_confirmation_request',
    }
}