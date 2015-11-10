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
    },
    associations: function(n) {
        DirectorJ.belongsTo(Document, {
            as: 'consent',
            foreignKey: {
                name: 'consentId',
                as: 'consent'
            }
        });
    },

    options: {
        freezeTableName: false,
        tableName: 'directorj',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }
};