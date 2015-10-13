/**
 * DocumentDirectory.js
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
        name:{
            type: Sequelize.TEXT
        }
    },
    options: {
        freezeTableName: false,
        tableName: 'documentDirectory',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }
};