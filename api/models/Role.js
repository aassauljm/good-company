// api/models/Role.js

var _ = require('lodash');

//var UserRole = sequelize.define('userRole', {});
//var RolePermission = sequelize.define('rolePermission', {});

module.exports = {

  attributes: {
        name: {
          type: Sequelize.TEXT,
          index: true,
          notNull: true,
          unique: true
        },
        active: {
          type: 'boolean',
          defaultValue: true,
          index: true
        }
    },
    associations: function(){
        Role.belongsToMany(User, {
            as: 'users',
            through: 'user_roles',
            foreignKey: {
                name: 'roleId'
            }
        });
        Role.hasMany(Permission, {
            as: 'permissions',
            foreignKey: {
                name: 'roleId'
            }
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'role',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }
};
