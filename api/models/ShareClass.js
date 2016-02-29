/**
 * ShareClass.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: true
    },
    attributes: {

    },
    associations: function() {
        ShareClass.belongsToMany(ShareClasses, {
            as: 'shareClasses',
            foreignKey: 's_class_id',
            through: 's_c_j'
        });
    },

    options: {
        freezeTableName: false,
        tableName: 'share_class', // Optional, but I suggest to set it
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }
};