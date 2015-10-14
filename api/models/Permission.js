// api/models/Permission.js

var _ = require('lodash');

/**
 * @module Permission
 *
 * @description
 *   The actions a Role is granted on a particular Model and its attributes
 */
module.exports = {

    attributes: {


        action: {
            type: Sequelize.ENUM(
                'create',
                'read',
                'update',
                'delete'),
            index: true,
            unique: 'permissionIndex'
        },

        relation: {
            type: Sequelize.ENUM(
                'role',
                'owner',
                'user'),
            defaultValue: 'role',
            index: true,
            unique: 'permissionIndex'
        },

        user_id: {
            type: Sequelize.INTEGER,
            unique: 'permissionIndex'
        },

        role_id: {
            type: Sequelize.INTEGER,
            unique: 'permissionIndex'
        }
    },


    associations: function() {
        Permission.belongsTo(Model, {
            foreignKey: {
                name: 'model_id',
                as: 'model'
            }
        });
        Permission.belongsTo(Role, {
            foreignKey: {
                name: 'role_id',
                as: 'role'
            }
        });
        Permission.belongsTo(User, {
            foreignKey: {
                name: 'user_id',
                as: 'user'
            }
        });
        Permission.hasMany(Criteria, {
            foreignKey: {
                as: 'criteria'
            }
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'permission',
        classMethods: {},
        instanceMethods: {},
        hooks: {
            afterValidate: [
                function validateOwnerCreateTautology(permission, next) {
                    if (permission.relation == 'owner' && permission.action == 'create') {
                        throw new Error('Creating a Permission with relation=owner and action=create is tautological');
                    }

                    if (permission.action === 'delete' &&
                        _.filter(permission.criteria, function(criteria) {
                            return !_.isEmpty(criteria.blacklist);
                        }).length) {
                        throw new Error('Creating a Permission with an attribute blacklist is not allowed when action=delete');
                    }

                    if (permission.relation == 'user' && permission.user === "") {
                        throw new Error('A Permission with relation user MUST have the user attribute set');
                    }

                    if (permission.relation == 'role' && permission.role === "") {
                        throw new Error('A Permission with relation role MUST have the role attribute set');
                    }
                }
            ]

        }
    }
};