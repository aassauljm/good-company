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
            type: Sequelize.INTEGER,
            validate: {
                //min: 1
            }
        },
       /* shareClass: {
            type: Sequelize.TEXT,
            required: true
        },*/
    },
    associations: function() {
        Parcel.belongsToMany(Holding, {
            foreignKey: {
                as: 'parcels',
                name: 'parcelId'
            },
            through: 'parcel_j'
        });
        Parcel.belongsTo(ShareClass, {
            as: 'sc',
            foreignKey: 'shareClass'
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'parcel',
        classMethods: {
            match: function(a, b) {
                //return !a.shareClass && !b.shareClass || a.shareClass === b.shareClass;
                return !a.shareClass || !b.shareClass || a.shareClass === b.shareClass;
            }
        },
        instanceMethods: {
            combine: function(other){
                if(Parcel.match(this, other)){
                    return Parcel.build({amount: this.amount + other.amount, shareClass: this.shareClass || other.shareClass});
                }
                else{
                    throw new sails.config.exceptions.BadParcelOperation("Parcels do not match");
                }
            },
            subtract: function(other){
                if(Parcel.match(this, other)){
                    return Parcel.build({amount: this.amount - other.amount, shareClass: this.shareClass || other.shareClass});
                }
                else{
                    throw new sails.config.exceptions.BadParcelOperation("Parcels do not match");
                }
            },
            replace: function(other){
                return Parcel.build(_.merge({amount: this.amount, shareClass: this.shareClass}, other));
            }
        },
        hooks: {}
    }
};