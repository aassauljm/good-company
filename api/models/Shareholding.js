/**
 * Shareholding.js
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
        Shareholding.belongsTo(Company, {
            as: 'company',
            foreignKey: {
                name: 'companyId',
                as: 'company'
            }
        });
        Shareholding.belongsTo(Transaction, {
            as: 'transaction',
            foreignKey: {
                name: 'transactionId'
            }
        });
        Shareholding.hasMany(Parcel, {
            as: 'parcels',
            notNull: true,
            foreignKey: {
                as: 'parcels',
                name: 'shareholdingId'
            }
        });
        Shareholding.belongsToMany(Shareholder, {
            as: 'shareholders',
            foreignKey: {
                as: 'shareholders',
                name: 'shareholderId'
            },
            through: 'shareholdingShareholder'
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'shareholding',
        classMethods: {},
        instanceMethods: {
            shareholdersMatch: function(other){
                return this.getShareholders()
                    .then(function(shareholders){
                        if(!other.shareholders){
                            return false;
                        }
                        return _.isEqual(
                                   _.sortBy(other.shareholders.map(function(s){ return _.filter(_.pick(s.get ? s.get() : s, 'name', 'companyNumber')); }), 'name'),
                                    _.sortBy(shareholders.map(function(s){ return _.filter(_.pick(s.get ? s.get() : s, 'name', 'companyNumber')); }), 'name'));
                });
            },
            combine: function(parcel) {
                //var model = new Shareholding._model(this.toObject());

                var model = new Shareholding._model(clone(this))
                this.parcels.map(function(p) {
                    model.parcels.add(clone(p))
                })

               // console.log(model.parcels)
                    // this.parcels.map(function(parcel){
                    //     if(parcels)
                    // })
            }



        },
        hooks: {}
    }


};