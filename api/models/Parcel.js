/**
 * Parcel.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
var Promise = require('bluebird');


module.exports = {

    attributes: {
        amount: {
            type: Sequelize.INTEGER
        },
        shareClass: {
            type: Sequelize.TEXT
        },
    },
    associations: function() {
    },
    options: {
        freezeTableName: false,
        tableName: 'parcel',
        classMethods: {
            match: function(a, b) {
                return a.shareClass === b.shareClass;
            }
        },
        instanceMethods: {
            combine: Promise.method(function(other){
                if(Parcel.match(this, other)){
                    return Parcel.build({shareClass: this.shareClass, amount: this.amount + other.amount });
                }
                else{
                    throw new sails.config.exceptions.BadParcelOperation("Parcels do not match");
                }
            })

        },
        hooks: {}
    }
};