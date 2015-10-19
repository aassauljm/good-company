/**
 * Transaction.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
 var _ = require('lodash');
 var Promise = require('bluebird');


 var types = {
    SEED: 'SEED',
    ISSUE_INCORPORATION: 'ISSUE_INCORPORATION',
    ISSUE_PROPORTIONAL: 'ISSUE_PROPORTIONAL',
    ISSUE_NONPROPORTIONAL: 'ISSUE_NONPROPORTIONAL'
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
        executed: {
            type: Sequelize.DATE,
        }
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
        instanceMethods: {
            groupShares: function() {
                return this.getShareholdings({
                    include: [{
                        model: Parcel,
                        as: 'parcels'
                    }]
                })
                .then(function(shareholdings) {
                    return _.groupBy(_.flatten(shareholdings.map(function(s) {
                        return s.parcels;
                    })), function(p) {
                        return p.shareClass;
                    });
                })
            },
            groupTotals: function() {
                return this.groupShares()
                .then(function(groups) {
                    return Promise.reduce(_.values(groups), function(acc, shares){
                        return Promise.reduce(shares, function(total, share){
                            return total.combine(share);
                        }, Parcel.build({
                            shareClass: shares[0].shareClass,
                            amount: 0
                        }))
                        .then(function(result){
                            acc[result.shareClass] = result.get();
                            return acc;
                        })
                    }, {});
                });
            },
            totalShares: function(){
                return this.getShareholdings({
                    include: [{
                        model: Parcel,
                        as: 'parcels'
                    }]
                })
                .then(function(shareholdings) {
                    return _.sum(_.flatten(shareholdings.map(function(s) {
                        return s.parcels;
                    })), function(p){
                        return p.amount;
                    });
                })
            }
        },
        hooks: {}
    }
};