/**
* Transaction.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

var types = {
    SEED: 'SEED',
    ISSUE: 'ISSUE',
    ISSUE_INCORPORATION: 'ISSUE_INCORPORATION',
    ISSUE_PROPORTIONAL: 'ISSUE_PROPORTIONAL',
    ISSUE_NONPROPORTIONAL: 'ISSUE_NONPROPORTIONAL'
};

module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },

  attributes: {
        type: {
            type: Sequelize.ENUM.apply(null, _.values(types))
        }
  },
    options: {
        freezeTableName: true,
        tableName: 'transaction',
        classMethods: {
            types: types
        },
        instanceMethods: {}
    }

};

