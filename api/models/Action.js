// api/models/Model.js

var _ = require('lodash');



module.exports = {


    attributes: {
        id: {
            type: Sequelize.UUID,
            primaryKey: true
        },
        data: {
            type: Sequelize.JSON
        }
    },
    associations: function(){
        Action.belongsTo(Action, {
            as: 'previous',
            foreignKey: {
                name: 'previous_id',
                as: 'previous'
            }
        });
    },
    options: {
        tableName: 'action',
        classMethods: {},
        instanceMethods: {},
        hooks: {},
        timestamps: false,
    }
};