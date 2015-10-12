// api/models/Model.js

var _ = require('lodash');
/*var _super = require('sails-permissions/api/models/Model');

_.merge(exports, _super);
_.merge(exports, {


});
*/

module.exports = {
  /*autoPK: true,
  autoCreatedBy: false,
  autoCreatedAt: false,
  autoUpdatedAt: false,*/

  attributes: {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    identity: {
      type: Sequelize.STRING,
      notNull: true
    },
    attributes: {
      type: Sequelize.JSON
    },
   },
   associations:  function(){
   		Model.hasMany(Permission, {as: 'permissions', foreignKey: 'model'})
   },
   options: {
   	tablename: 'model',
   	classMethods: {},
   	instanceMethods: {},
   	hooks: {}
   }
};
