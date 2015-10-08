/**
* Parcel.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    amount: {
        type: 'integer',
        required: true
    },
    shareClass: {
        type: 'string'
    },
    shareholding: {
        model: 'shareholding'
    }
  },
  combinable: function(a, b){
    return a.shareClass === b.shareClass;
  }
};

