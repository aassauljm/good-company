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
            allowNull: false,
            validate: {
                min: 5,
            }
        },
        email: {
            type: Sequelize.TEXT,
            unique: true,
            index: true,
                allowNull: false,
            validate: {
                isEmail: true,
            }
        }
    },
    associations: function() {
        User.belongsTo(User, {
            as: 'owner',
            foreignKey: {
                name: 'ownerId'
            }
        });
        User.belongsTo(User, {
            as: 'createdBy',
            foreignKey: {
                name: 'createdById'
            }
        });
        User.hasMany(Passport, {
            foreignKey: {
                as: 'passports',
                name: 'userId'
            }
        });
        User.belongsToMany(Role, {
            as: 'roles',
            unique: true,
            through: 'user_roles',
            foreignKey:{
                name:  'userId'
            }
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'user',
        classMethods: {
            register: function(user) {
                return sails.services.passport.protocols.local.createUser(user)
            },
            userWithRoles: function(id){
                return User.findOne({
                    where: {
                        id: id
                    },
                    include: [{model: Role, as: 'roles'}]
                })
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
            beforeValidate: [
                function(user) {
                    if (user.email) {
                        user.email = user.email.toLowerCase();
                    }
                }
            ],
            afterCreate: [
                function setOwner(user) {
                    sails.log.verbose('User.afterCreate.setOwner', user);
                    return User
                    .update({
                        ownerId: user.id
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