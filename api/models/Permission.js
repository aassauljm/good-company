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
                'user',
                'organisation',
                'catalex'),
            defaultValue: 'role',
            index: true,
            unique: 'permissionIndex'
        },

        userId: {
            type: Sequelize.INTEGER,
            unique: 'permissionIndex'
        },
        roleId: {
            type: Sequelize.INTEGER,
            unique: 'permissionIndex'
        },
        catalexId: {
            type: Sequelize.TEXT
        },
        entityId: {
            type: Sequelize.INTEGER
        },
        allow: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
        }
    },


    associations: function() {
        Permission.belongsTo(Model, {
            foreignKey: {
                name: 'modelId',
                as: 'model'
            }
        });
        Permission.belongsTo(Role, {
            foreignKey: {
                name: 'roleId',
                as: 'role'
            }
        });
        Permission.belongsTo(User, {
            foreignKey: {
                name: 'userId',
                as: 'user'
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