/**
 * Transaction.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

var types = require('../../config/enums/transactions').enums;

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
        data: {
            type: Sequelize.JSONB
        },
        effectiveDate: {
            type: Sequelize.DATE
        }
    },
    associations: function() {
        Transaction.belongsTo(Transaction, {
            as: 'parentTransaction',
            foreignKey: {
                name: 'parentTransactionId',
                as: 'parentTransaction'
            }
        });
        Transaction.hasMany(Transaction, {
            as: 'childTransactions',
            foreignKey: {
                name: 'parentTransactionId',
                as: 'parentTransaction'
            }
        });
        Transaction.belongsToMany(Document, {
            as: 'documents',
            foreignKey: 'transaction_id',
            through: 't_d_j'
        });
    },
    options: {
        freezeTableName: true,
        tableName: 'transaction',
        classMethods: {
            types: types,
            buildDeep: function(data){
                return Transaction.build(data, {include: [{model: Transaction, as: 'childTransactions'}, {model: Document, as: 'documents'}]});
            }
        },
        instanceMethods: {}
    }

};