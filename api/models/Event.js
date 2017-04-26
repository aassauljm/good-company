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
                name: 'ownerId'
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
        classMethods: {
            getEvents: function(userId){
                return sequelize.query("select events_json(:userId)",
                           { type: sequelize.QueryTypes.SELECT,
                            replacements: {userId: userId || null}})
                .then(r => r[0].events_json || [])
            }
        },
        instanceMethods: {},
        hooks: {}
    }
};
