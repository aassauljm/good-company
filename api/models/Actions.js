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
        instanceMethods: {
            buildNext: function(){
                if(this.isNewRecord){
                    return Promise.resolve(this);
                }
                return Actions.build({actions: this.dataValues.actions})
            }
        },
        hooks: {}
    }
};
