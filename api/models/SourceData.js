// api/models/Actions.js

var _ = require('lodash');

module.exports = {

    attributes: {
        source: {
            type: Sequelize.TEXT
        },
        data: {
            type: Sequelize.JSON
        }

    },
    associations: function(){
    },
    options: {
        freezeTableName: false,
        tableName: 'source_data',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }
};
