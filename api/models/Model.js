// api/models/Model.js

var _ = require('lodash');



module.exports = {
  attributes: {
    name: {
      type: Sequelize.STRING,
      unique: true,
    },
    identity: {
      type: Sequelize.STRING,
    },
    attribs: {
      type: Sequelize.JSON
    },
   },
   associations:  function(){

   },
   options: {
   	tableName: 'model',
   	classMethods: {},
   	instanceMethods: {},
   	hooks: {},
    timestamps: false,
   }
};
