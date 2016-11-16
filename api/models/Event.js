// api/models/Actions.js

var _ = require('lodash');

module.exports = {

    attributes: {
        date: {
            type: Sequelize.DATE
        },
        data: {
            type: Sequelize.JSON
        }

    },
    associations: function(){
        Event.belongsTo(User, {
            as: 'owner',
            foreignKey: {
                name: 'userId'
            }
        });


        Event.belongsTo(Company, {
            as: 'company',
            foreignKey: {
                name: 'companyId',
                as: 'company'
            }
        });

    },
    options: {
        freezeTableName: false,
        tableName: 'event',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }
};
