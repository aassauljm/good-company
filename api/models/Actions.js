// api/models/Actions.js

var _ = require('lodash');

module.exports = {

    attributes: {
        actions: {
            type: Sequelize.JSON
        }

    },
    associations: function(){
    },
    options: {
        freezeTableName: false,
        tableName: 'actions', // Optional, but I suggest to set it
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }
};
