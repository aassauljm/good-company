// api/models/Model.js

var _ = require('lodash');



module.exports = {


    attributes: {       
        name: {
            type: Sequelize.TEXT
        }
    },
    options: {
        tableName: 'migrations',
        classMethods: {},
        instanceMethods: {},
        hooks: {},
        timestamps: false,
    }
};