// api/models/SecurityLog.js

var _ = require('lodash');

module.exports = {
  attributes: {

  },
  associations: function(){
       SecurityLog.hasOne(RequestLog, {as: 'request'});
  },
      options: {
        freezeTableName: false,
        tableName: 'securityLog',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }
};

