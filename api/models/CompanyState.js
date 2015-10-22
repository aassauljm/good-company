/**
 * CompanyState.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
var _ = require('lodash');
var Promise = require('bluebird');


module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },
    attributes: {
        executed: {
            type: Sequelize.DATE,
        }
    },
    associations: function(n) {
        CompanyState.belongsTo(Transaction, {
            as: 'transaction',
            foreignKey: {
                name: 'transactionId',
                as: 'transaction'
            }
        });
        CompanyState.hasMany(Holding, {
            as: 'holdings',
            foreignKey: {
                name: 'companyStateId',
                as: 'holdings'
            }
        });
        CompanyState.belongsTo(CompanyState, {
            as: 'previousCompanyState',
            foreignKey: {
                name: 'previousCompanyStateId',
                as: 'previousCompanyState'
            }
        });
        CompanyState.belongsToMany(Parcel, {
            as: 'unallocatedParcels',
            notNull: true,
            foreignKey: {
                as: 'parcels',
                name: 'companyStateId'
            },
            through: 'parcelTJ'
        });
    },
    options: {
        freezeTableName: true,
        tableName: 'companystate',
        classMethods: {
            includes: {
                full: function(){
                    return [{
                        model: Holding,
                        as: 'holdings',
                        include: [{
                            model: Parcel,
                            as: 'parcels'
                        }, {
                            model: Holder,
                            as: 'holders'
                        }]
                    },{
                        model: Parcel,
                        as: 'unallocatedParcels'
                    },{model: Transaction, as: 'transaction'}]
                },
                fullNoJunctions: function(){
                    return [{
                        model: Holding,
                        as: 'holdings',
                        include: [{
                            model: Parcel,
                            as: 'parcels',
                            through: {attributes: []}
                        }, {
                            model: Holder,
                            as: 'holders',
                            through: {attributes: []}
                        }]
                    },{
                        model: Parcel,
                        as: 'unallocatedParcels'
                    },{model: Transaction, as: 'transaction'}]
                }
            },
            ordering: {
                full: function(){
                    return [
                        [{model: Holding, as: 'holdings'}, 'id', 'ASC'],
                        [{model: Holding, as: 'holdings'}, {model: Parcel, as: 'parcels'}, 'shareClass', 'ASC'],
                        [{model: Holding, as: 'holdings'}, {model: Holder, as: 'holders'}, 'name', 'ASC'],
                    ]
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
                        return CompanyState
                            .build(_.extend(attr, {
                                companyId: this.companyId,
                                holdings: holdings,
                                previousCompanyStateId: id
                            }), {
                                include: CompanyState.includes.fullNoJunctions()
                            })
                    })
                    .then(function(state){
                        // items with id are not newRecords
                        state.get('holdings').map(function(sh){
                            sh.get('holders').map(function(holders){
                                holders.isNewRecord = false;
                            })
                            sh.get('parcels').map(function(parcels){
                                parcels.isNewRecord = false;
                            })
                        })
                        return state;
                    })
            }
        },
        hooks: {}
    }
};