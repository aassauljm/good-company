// api/models/Criteria.js

var _ = require('lodash');

module.exports = {

    attributes: {
        date: {
            type: Sequelize.DATE
        },
        details: {
            type: Sequelize.TEXT
        }
    },
    associations: function(){
    },
    options: {
        freezeTableName: false,
        tableName: 'interests_register',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }
};
