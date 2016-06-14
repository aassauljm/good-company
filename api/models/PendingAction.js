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
        PendingAction.belongsTo(PendingAction, {
            as: 'previous',
            foreignKey: {
                name: 'previous_id',
                as: 'previous'
            }
        });
    },
    options: {
        tableName: 'pending_actions',
        classMethods: {},
        instanceMethods: {},
        hooks: {},
        timestamps: false,
    }
};