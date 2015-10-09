/**
 * Shareholding.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

var clone = function(obj){
    return _.omit(obj.toObject(), 'id', 'createdBy', 'createdAt', 'updatedAt')
}

module.exports = {

    attributes: {
        company: {
            model: 'company'
        },
        parcels: {
            collection: 'parcel',
            via: 'shareholding'
        },
        shareholders: {
            collection: 'shareholder',
            via: 'shareholdings',
            dominant: true
        },
        transaction: {
            model: 'transaction'
        },
        add: function(holding){
            return this
        },
        combine: function(parcel){
            //var model = new Shareholding._model(this.toObject());

            var model = new Shareholding._model(clone(this))
            this.parcels.map(function(p){
                model.parcels.add(clone(p))   
            })

            console.log(model.parcels)
           // this.parcels.map(function(parcel){
           //     if(parcels)
           // })
        }
    },
};