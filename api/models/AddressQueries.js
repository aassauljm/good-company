// api/models/Model.js

var _ = require('lodash');



module.exports = {
    attributes: {
        query: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        postal: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        addresses: {
            type: Sequelize.JSONB
        }
    },
    associations: function(){
    },
    options: {
        tableName: 'address_queries',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }
};