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
        // TODO, make a scoped query or something
        CompanyState.belongsToMany(Parcel, {
            as: 'unallocatedParcels',
            notNull: true,
            foreignKey: {
                as: 'parcels',
                name: 'companyStateId'
            },
            through: 'parcelCJ'
        });
        /*CompanyState.belongsToMany(Parcel, {
            as: 'overallocatedParcels',
            notNull: true,
            foreignKey: {
                as: 'parcelss',
                name: 'companyStateId'
            },
            through: 'parcelCCJ'
        });*/
    },
    options: {
        freezeTableName: true,
        tableName: 'companystate',
        classMethods: {
            includes: {
                full: function(){
                    return [
                    {
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
                    },/*{
                        model: Parcel,
                        as: 'overallocatedParcels'
                    },*/{
                        model: Transaction,
                        as: 'transaction'
                    }]
                },
                fullNoJunctions: function(){
                    return [
                    {
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
                    },/*{
                        model: Parcel,
                        as: 'overallocatedParcels'
                    },*/{
                        model: Transaction,
                        as: 'transaction'
                    }]
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
            totalAllocatedShares: function() {
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
            totalUnallocatedShares: function() {
                return this.getUnallocatedParcels()
                    .then(function(parcels) {
                        return _.sum(parcels, function(p) {
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
                        return {holdings: holdings.map(function(holding) {
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
                            };
                        })};

                    })
            },
            cloneUnallocated: function(){
                return this.getUnallocatedParcels()
                    .then(function(parcels){
                        return {unallocatedParcels: parcels.map(function(p){
                            return p;
                        })};
                    });
            },
            buildNext: function(attr) {
                var id = this.id;
                return Promise.join(this.cloneHoldings(), this.cloneUnallocated(),
                        function(holdings, unallocatedParcels) {
                        return CompanyState
                            .build(_.extend(attr, {
                                previousCompanyStateId: id
                            }, holdings, unallocatedParcels), {
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
                        });
                        state.get('unallocatedParcels').map(function(p){
                            p.isNewRecord = false;
                        })
                        return state;
                    })
            },
            buildPrevious: function(attr){
                return this.buildNext(attr)
                    .then(function(state){
                        state.setPreviousCompany(null)
                        return state;
                    })
            },
            combineHoldings: function(newHoldings, removeHoldings){
                if(this.id){
                    throw new sails.config.exceptions.BadImmutableOperation();
                }
                " For now, using name equivilency to match holders (and companyId) "
                " Match all holders in a holding, then an issue will increase the parcels on that holding "
                _.some(this.dataValues.holdings, function(nextHolding){
                    var toRemove;
                    newHoldings.forEach(function(sharesToAdd, i){
                        sharesToAdd = Holding.build(sharesToAdd,
                                {include: [{model: Parcel, as: 'parcels'}, {model: Holder, as: 'holders'}]} );
                        if(nextHolding.holdersMatch(sharesToAdd)){
                            if(removeHoldings){
                                newHolding.removeParcels(sharesToAdd);
                            }
                            else{
                                nextHolding.combineParcels(sharesToAdd);
                            }
                            toRemove = i;
                            return false;
                        }
                    })
                    if(toRemove !== undefined){
                        newHoldings.splice(toRemove, 1);
                    }
                    if(!newHoldings.length){
                        return true;
                    }
                });
                var newShares = newHoldings.map(function(sharesToAdd, i){
                    return Holding.build(sharesToAdd,
                                {include: [{model: Parcel, as: 'parcels'}, {model: Holder, as: 'holders'}]});
                });
                if(removeHoldings && newShares.length){
                    throw new sails.config.exceptions.InvalidInverseOperation('Unknown holders to issue to');
                }
                this.dataValues.holdings = this.dataValues.holdings.concat(newShares);
                return this;
            },
            removeHoldings: function(removeHoldings){
                return combineHoldings(removeHoldings, true);
            }
        },
        hooks: {}
    }
};