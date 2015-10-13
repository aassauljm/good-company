// api/models/RequestLog.js

var _ = require('lodash');

module.exports = {

  attributes: {
        id: {
          type: Sequelize.TEXT,
          primaryKey: true
        },
        ipAddress: {
          type: Sequelize.TEXT,
        },
        method: {
          type: Sequelize.TEXT,
        },
        url: {
          type: Sequelize.TEXT,
          url: true
        },
        body: {
          type: Sequelize.JSON,
        }
    },
    associations: function(){
        RequestLog.belongsTo(User, {
            as: 'user'
        });
        RequestLog.belongsTo(Model, {
            as: 'model'
        })
    },
    options: {
        freezeTableName: false,
        tableName: 'requestLog',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }

};

