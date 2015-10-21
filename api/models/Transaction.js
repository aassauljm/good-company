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
    ISSUE: 'ISSUE',
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
        Transaction.hasMany(Holding, {
            as: 'holdings',
            foreignKey: {
                name: 'transactionId',
                as: 'holdings'
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
            types: types,
            includes: {
                full: function(){
                    return [{
                        model: Holding,
                        as: 'holdings',
                       // through: {attributes: []},
                        include: [{
                            model: Parcel,
                            as: 'parcels',
                            order: ['shareClass', 'DESC'],
                           // through: {attributes: []}
                        }, {
                            model: Holder,
                            as: 'holders',
                            order: ['name', 'DESC'],
                           // through: {attributes: []}
                        }]
                    }]
                },
                fullNoJunctions: function(){
                    return [{
                        model: Holding,
                        as: 'holdings',
                        include: [{
                            model: Parcel,
                            as: 'parcels',
                            order: ['shareClass', 'DESC'],
                            through: {attributes: []}
                        }, {
                            model: Holder,
                            as: 'holders',
                            order: ['name', 'DESC'],
                            through: {attributes: []}
                        }]
                    }]
                }
            }
        },
        instanceMethods: {
            groupShares: function() {
                return this.getHoldings({
                        include: [{
                            model: Parcel,
                            as: 'parcels'
                        }]
                    })
                    .then(function(holdings) {
                        return _.groupBy(_.flatten(holdings.map(function(s) {
                            return s.parcels;
                        })), function(p) {
                            return p.shareClass;
                        });
                    })
            },
            groupTotals: function() {
                return this.groupShares()
                    .then(function(groups) {
                        return Promise.reduce(_.values(groups), function(acc, shares) {
                            var result = _.reduce(shares, function(total, share) {
                                    return total.combine(share);
                                }, Parcel.build({
                                    shareClass: shares[0].shareClass,
                                    amount: 0
                                }));
                            acc[result.shareClass] = result.get();
                            return acc;
                        }, {});
                    });
            },
            totalShares: function() {
                return this.getHoldings({
                        include: [{
                            model: Parcel,
                            as: 'parcels',
                        }]
                    })
                    .then(function(holdings) {
                        return _.sum(_.flatten(holdings.map(function(s) {
                            return s.parcels;
                        })), function(p) {
                            return p.amount;
                        });
                    })
            },
            cloneHoldings: function() {
                return this.getHoldings({
                        include: [{
                            model: Parcel,
                            as: 'parcels',
                            // drop junction info
                            through: {attributes: []}
                        }, {
                            model: Holder,
                            as: 'holders',
                            through: {attributes: []}
                        }]
                    })
                    .then(function(holdings) {
                        return holdings.map(function(holding) {
                            var parcels = holding.parcels.map(function(p) {
                                return p.get()
                            });
                            var holders = holding.holders.map(function(p) {
                                return p.get()
                            });
                            return {
                                parcels: parcels,
                                holders: holders,
                                companyId: holding.companyId
                            }
                        });
                    });
            },
            buildNext: function(attr) {
                var id = this.id;
                return this.cloneHoldings()
                    .then(function(holdings) {
                        return Transaction
                            .build(_.extend(attr, {
                                companyId: this.companyId,
                                holdings: holdings,
                                previousTransactionId: id
                            }), {
                                include: [{
                                    model: Holding,
                                    as: 'holdings',
                                    include: [{
                                        model: Parcel,
                                        as: 'parcels'
                                    }, {
                                        model: Holder,
                                        as: 'holders'
                                    }]
                                }]
                            })
                    })
                    .then(function(transaction){
                        // items with id are not newRecords
                        transaction.get('holdings').map(function(sh){
                            sh.get('holders').map(function(holders){
                                holders.isNewRecord = false;
                            })
                            sh.get('parcels').map(function(parcels){
                                parcels.isNewRecord = false;
                            })
                        })
                        return transaction;
                    })
            }
        },
        hooks: {}
    }
};