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
        holdingId: {
            type: Sequelize.INTEGER
        },
        name: {
            type: Sequelize.TEXT
        }
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
                name: 'holdingId'
            },
            through: 'holderJ'
        });
        Holding.belongsTo(Transaction, {
            as: 'transaction',
            foreignKey: {
                name: 'transactionId',
                as: 'transaction'
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
                            {model: Person, as: 'holders'},
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
                var clean = function(list){
                    return _.sortBy(list.map(function(s){
                        return _.pick(_.pick(s.get ? s.get() : s, 'amount', 'shareClass'), _.identity);
                    }), 'amount');
                }
                return _.isEqual(clean(other.parcels), clean(this.dataValues.parcels));
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
            }
        },
        hooks: {
            afterSync: [function addAutoIncrement(){
                return sequelize.query(`CREATE SEQUENCE holding_id_sequence;
                                       ALTER TABLE holding ALTER COLUMN "holdingId" SET DEFAULT nextval('holding_id_sequence');
                                       ALTER SEQUENCE holding_id_sequence OWNED BY holding."holdingId"; `)
                    .catch(function(){
                        // sequence exists, ignore
                    })

            }]

        }
    }


};