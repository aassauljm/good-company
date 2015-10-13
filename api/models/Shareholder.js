/**
* Shareholder.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

//var ShareholderShareholding = sequelize.define('shareHolderShareholding', {});


module.exports = {

  attributes: {
    name: {
        type: Sequelize.TEXT
    },
    companyNumber: {
        type:  Sequelize.TEXT
    }
    },
    associations: function(){
        Shareholder.belongsToMany(Shareholding,
          {foreignKey: {
            as: 'shareholdings',
            name: 'shareholding_id'
            }, through: 'shareholding_shareholder'
        })
    },
      options: {
        freezeTableName: false,
        tableName: 'shareholder',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }

};

