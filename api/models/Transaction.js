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
            types: types,
            includes: {
                full: function(){
                    return [{
                        model: Shareholding,
                        as: 'shareholdings',
                        include: [{
                            model: Parcel,
                            as: 'parcels',
                            order: ['shareClass', 'DESC']
                        }, {
                            model: Shareholder,
                            as: 'shareholders',
                            order: ['name', 'DESC']
                        }]
                    }]
                }
            }
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
                return this.getShareholdings({
                        include: [{
                            model: Parcel,
                            as: 'parcels'
                        }]
                    })
                    .then(function(shareholdings) {
                        return _.sum(_.flatten(shareholdings.map(function(s) {
                            return s.parcels;
                        })), function(p) {
                            return p.amount;
                        });
                    })
            },
            cloneShareholdings: function() {
                return this.getShareholdings({
                        include: [{
                            model: Parcel,
                            as: 'parcels'
                        }, {
                            model: Shareholder,
                            as: 'shareholders'
                        }]
                    })
                    .then(function(shareholdings) {
                        return shareholdings.map(function(shareholding) {
                            var parcels = shareholding.parcels.map(function(p) {
                                return _.omit(p.get(), 'shareholdingParcel')
                            });
                            var shareholders = shareholding.shareholders.map(function(p) {
                                return _.omit(p.get(), 'shareholdingShareholder')
                            });
                            return {
                                parcels: parcels,
                                shareholders: shareholders,
                                companyId: shareholding.companyId
                            }
                        });
                    });
            },
            buildNext: function(attr) {
                var id = this.id;
                return this.cloneShareholdings()
                    .then(function(shareholdings) {
                        return Transaction
                            .build(_.extend(attr, {
                                companyId: this.companyId,
                                shareholdings: shareholdings,
                                previousTransactionId: id
                            }), {
                                include: [{
                                    model: Shareholding,
                                    as: 'shareholdings',
                                    include: [{
                                        model: Parcel,
                                        as: 'parcels'
                                    }, {
                                        model: Shareholder,
                                        as: 'shareholders'
                                    }]
                                }]
                            })
                    })
                    .then(function(transaction){
                        // items with id are not newRecords
                        transaction.get('shareholdings').map(function(sh){
                            sh.get('shareholders').map(function(holders){
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