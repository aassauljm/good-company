/**
 * Shareholding.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    attributes: {

    },
    associations: function() {
        Shareholding.belongsTo(Company, {
            as: 'company',
            foreignKey: {
                name: 'company_id',
                as: 'company'
            }
        });
        Shareholding.belongsTo(Transaction, {
            as: 'transaction',
            foreignKey: {
                name: 'transaction_id'
            }
        });
        Shareholding.hasMany(Parcel, {
            as: 'parcels',
            notNull: true,
            foreignKey: {
                name: 'shareholding_id'
            }
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'shareholding',
        classMethods: {},
        instanceMethods: {
            add: function(holding) {
                return this
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