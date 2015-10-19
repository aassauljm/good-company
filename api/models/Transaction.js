/**
 * Transaction.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
_ = require('lodash');

var types = {
    SEED: 'SEED'
};

module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },

    attributes: {
        type: {
            type: Sequelize.ENUM.apply(null, _.values(types))
        },
    },
    associations: function(n) {
        Transaction.hasMany(Shareholding, {
            as: 'shareholdings',
            foreignKey: {
                name: 'transactionId',
                as: 'shareholdings'
            }
        });
        Transaction.belongsTo(Transaction, {
            as: 'previousTransaction',
            foreignKey: {
                name: 'previousTransactionId',
                as: 'previousTransaction'
            }
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'transaction',
        classMethods: {
            types: types
        },
        instanceMethods: {},
        hooks: {}
    }
};