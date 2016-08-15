/**
 * Holding.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
     _config: {
        actions: false,
        shortcuts: false,
        rest: false
      },
    attributes: {
        // will turn to sequence in hook
        /*holdingId: {
            type: Sequelize.INTEGER
        },*/
        name: {
            type: Sequelize.TEXT
        },
        data: {
            type: Sequelize.JSON
        }
    },
    associations: function() {
        Holding.belongsToMany(HoldingList, {
            as: 'holding_list',
            foreignKey: {
                name: 'h_j_id',
                as: 'holding_list'
            },
            through: 'h_list_j'
        });
        Holding.belongsToMany(Parcel, {
            as: 'parcels',
            notNull: true,
            foreignKey: {
                as: 'parcels',
                name: 'holdingId'
            },
            through: 'parcel_j'
        });
        Holding.belongsToMany(Person, {
            //foreignKey: 'HoldingId',
            as: 'holders',
            foreignKey: {
                name: 'holdingId',
                as: 'holders'
            },
            through: HolderJ
        });
        Holding.belongsTo(Transaction, {
            as: 'transaction',
            foreignKey: {
                name: 'transactionId',
                as: 'transaction'
            }
        });
        Holding.belongsTo(Entity, {
            as: 'entity',
            foreignKey: {
                name: 'holdingId',
                as: 'entity'
            }
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'holding',
        classMethods: {
            buildDeep: function(data){
                // NEEDS NOT CREATE NEW PERSONS IF THEY HAVE IDS,
                var holding = Holding.build(data, {include: [
                            {model: Parcel, as: 'parcels'},
                            {model: Person, as: 'holders', include: [{
                                    model: Transaction,
                                    as: 'transaction',
                                }]},
                            {model: Transaction, as: 'transaction'}]});
                return holding;

            }
        },
        instanceMethods: {
            holdersMatch: function(other, ignoreCompanyNumber){
                if(!other.holders){
                    return false;
                }
                var clean = function(list){
                    // because of captials here: http://www.business.govt.nz/companies/app/ui/pages/companies/2109736/21720700/entityFilingRequirement
                    // we will now do case insensitive
                    return _.sortBy(list.map(function(s){
                        return _.pick(_.pick(s.get ? s.get() : s, 'name', ignoreCompanyNumber ? null : 'companyNumber'), _.identity);
                    }), 'name');
                }
                return _.isEqual(clean(other.holders), clean(this.dataValues.holders), function(a, b){
                    if(a.toLowerCase){
                        return (a||'').toLowerCase() === (b||'').toLowerCase();
                    }
                });
            },
            parcelsMatch: function(other){
                if(!other.parcels){
                    return false;
                }
                const otherSorted = _.sortBy(other.parcels, 'amount');
                const thisSorted = _.sortBy(this.dataValues.parcels, 'amount');
                return _.all(thisSorted, (p, i) => {
                    return Parcel.match(p, otherSorted[i]) && p.amount === otherSorted[i].amount;
                })
            },
            hasNonEmptyParcels: function(){
                return _.sum(this.dataValues.parcels, 'amount') > 0;
            },
            combineParcels: function(holding){
                var newParcels = [];
                if(holding.get){
                    holding = holding.get();
                }
                _.some(this.dataValues.parcels, function(currentP, i){
                    var match = _.some(holding.parcels, function(addP){
                        if(Parcel.match(addP, currentP)){
                            newParcels.push(currentP.combine(addP));
                            holding.parcels = _.without(holding.parcels, addP)
                            return true;
                        }
                    });
                    if(!match){
                        newParcels.push(currentP);
                    }
                });
                this.dataValues.parcels = newParcels.concat(holding.parcels.map(p => Parcel.build(p)));
            },
            subtractParcels: function(holding){
                // subtract isn't quite the opposite of combine, and there must be an
                // existing matching parcel
                if(holding.get){
                    holding = holding.get();
                }
                var newParcels = [];
                _.some(this.dataValues.parcels, function(currentP, i){
                    var match = _.some(holding.parcels, function(addP){
                        if(Parcel.match(addP, currentP)){
                            newParcels.push(currentP.subtract(addP));
                            return true;
                        }
                    });
                    if(!match){
                        newParcels.push(currentP);
                    }
                });
                this.dataValues.parcels = newParcels;
            },
            buildNext: function(){
                if(this.isNewRecord){
                    return this;
                }
                const holding = Holding.build(_.merge({}, this.get(), {id: null}), {include: [{
                                model: Parcel,
                                as: 'parcels',
                                through: {
                                    attributes: []
                                }
                            }, {
                                model: Person,
                                as: 'holders',
                                //through: {
                                //    attributes: []
                               // },
                                include: [{
                                    model: Transaction,
                                    as: 'transaction',
                                }]
                            }, {
                                model: Transaction,
                                as: 'transaction',
                            }]});
                holding.dataValues.holders.map(h => {
                    h.isNewRecord = false;
                    h._changed = {};
                });
                holding.dataValues.parcels.map(p => {
                    p.isNewRecord = false;
                    p._changed = {};
                });
                if(holding.transaction){
                    holding.transaction.isNewRecord = false;
                    holding.transaction._change = {};
                }
                return holding;
            }
        },
        hooks: {
        }
    }


};