/**
 * DirectorJ.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },

    attributes: {
        appointment: {
            type: Sequelize.DATE
        },
        consentUrl: {
            type: Sequelize.TEXT
        }
    },
    associations: function(n) {
        Director.belongsTo(CompanyState, {
            as: 'companyState'
        });
        Director.belongsTo(Person, {
            as: 'person',
            foreignKey: {
                as: 'person',
                name: 'personId'
            }
        });
    },

    options: {
        freezeTableName: false,
        tableName: 'director',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }
};