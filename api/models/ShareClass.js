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
        name: {
            type: Sequelize.TEXT,
            allowNull: false,
            validate: {
                len: [1]
            }
        },
        properties: {
            type: Sequelize.JSON
        }
    },
    associations: function() {
        ShareClass.belongsToMany(ShareClasses, {
            as: 'shareClasses',
            foreignKey: 's_class_id',
            through: 's_c_j'
        });
        ShareClass.belongsToMany(Document, {
            as: 'documents',
            foreignKey: 'transaction_id',
            through: 's_c_d_j'
        });
    },

    options: {
        freezeTableName: false,
        tableName: 'share_class',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }
};