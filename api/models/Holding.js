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
    },
    associations: function() {
        Holding.belongsTo(CompanyState, {
            as: 'companyState',
            foreignKey: {
                name: 'companyStateId'
            }
        });
        Holding.belongsToMany(Parcel, {
            as: 'parcels',
            notNull: true,
            foreignKey: {
                as: 'parcels',
                name: 'holdingId'
            },
            through: 'parcelJ'
        });
        Holding.belongsToMany(Person, {
            as: 'holders',
            foreignKey: {
                as: 'holders',
                name: 'holderId'
            },
            through: 'holdingJ'
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'holding',
        classMethods: {
            buildDeep: function(data){
                // NEEDS NOT CREATE NEW PERSONS IF THEY HAVE IDS,
                return Holding.build(data, {include: [{model: Parcel, as: 'parcels'}, {model: Person, as: 'holders'}]});
            }
        },
        instanceMethods: {
            holdersMatch: function(other){
                if(!other.holders){
                        return false;
                    }
                var clean = function(list){
                    // because of captials here: http://www.business.govt.nz/companies/app/ui/pages/companies/2109736/21720700/entityFilingRequirement
                    // we will now do case insensitive
                    return _.sortBy(list.map(function(s){
                        return _.pick(_.pick(s.get ? s.get() : s, 'name', 'companyNumber'), _.identity);
                    }), 'name');
                }
                return _.isEqual(clean(other.holders), clean(this.holders), function(a, b){
                    if(a.toLowerCase){
                        return (a||'').toLowerCase() === (b||'').toLowerCase();
                    }
                });
            },
            combineParcels: function(holding){
                var newParcels = [];
                _.some(this.dataValues.parcels, function(currentP, i){
                    var match = _.some(holding.dataValues.parcels, function(addP){
                        if(Parcel.match(addP, currentP)){
                            newParcels.push(currentP.combine(addP));
                            holding.dataValues.parcels = _.without(holding.dataValues.parcels, addP)
                            return true;
                        }
                    });
                    if(!match){
                        newParcels.push(currentP);
                    }
                });
                this.dataValues.parcels = newParcels.concat(holding.dataValues.parcels);
            },
            subtractParcels: function(holding){
                var newParcels = [];
                _.some(this.dataValues.parcels, function(currentP, i){
                    var match = _.some(holding.dataValues.parcels, function(addP){
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
            }
        },
        hooks: {}
    }


};