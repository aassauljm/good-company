// api/models/Model.js

var _ = require('lodash');



module.exports = {


    attributes: {
        id: {
            type: Sequelize.UUID,
            primaryKey: true
        },
        data: {
            type: Sequelize.JSONB
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
        indexes: [{name: 'action_id_idx', fields: ['id']}],
        tableName: 'action',
        classMethods: {},
        instanceMethods: {},
        hooks: {},
        timestamps: false,
    }
};