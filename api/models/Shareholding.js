/**
 * Shareholding.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

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
            var model = new Shareholding._model(this.toObject());
            console.log(model)
           // this.parcels.map(function(parcel){
           //     if(parcels)
           // })
        }
    },
};