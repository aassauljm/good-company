/**
 * DocumentData.js
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
        data: {
            type: Sequelize.BLOB,
        }
    },
    associations: function() {

    },
    options: {
        freezeTableName: false,
        tableName: 'documentData',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }
};