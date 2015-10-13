// api/models/User.js

var _ = require('lodash');

var UserRoles = sequelize.define('userRoles', {});
var UserPermissions = sequelize.define('userPermissions', {});



module.exports = {

    attributes: {
        username: {
            type: Sequelize.TEXT,
            unique: true,
            index: true,
            notNull: true,
            required: true
        },
        email: {
            type: Sequelize.TEXT,
            unique: true,
            index: true,
            required: true
        }
    },
    associations: function() {
        User.hasMany(Passport, {
            foreignKey: {
                as: 'passports',
                name: 'user_id'
            }
        });
        User.belongsToMany(Role, {
            as: 'roles',
            unique: true,
            through: 'user_roles',
            foreignKey:{
                name:  'user_id'
            }
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'user',
        classMethods: {
            register: function(user) {
                return sails.services.passport.protocols.local.createUser(user)
            }
        },
        instanceMethods: {
            toJSON: function() {
                var user = this.get();
                delete user.password;
                return user;
            }
        },
        hooks: {

            beforeValidate: [function(user) {
                if (user.email) {
                    user.email = user.email.toLowerCase();
                }
            }],
            afterCreate: [
            function setOwner(user) {
                sails.log.verbose('User.afterCreate.setOwner', user);
                return User
                .update({
                    owner: user.id
                },{
                    where: { id: user.id}
                })
                .then(function(user) {})
                .catch(function(e) {
                    sails.log.error(e);
                });
            },
            function attachDefaultRole(user) {
                sails.log.verbose('User.afterCreate.attachDefaultRole', user);
                return User.findOne({where: {id: user.id}}, { include: 'roles'})
                .then(function(_user) {
                    user = _user;
                    return Role.findOne({where: {
                        name: 'registered'
                    }});
                })
                .then(function(role) {
                    return user.addRole(role)
                })
                .then(function(updatedUser) {
                    sails.log.verbose('role "registered" attached to user', user.username);
                })
                .catch(function(e) {
                    sails.log.error(e);
                })
            }
            ]

        }
    }

}