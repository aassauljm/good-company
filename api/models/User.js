// api/models/User.js

var _ = require('lodash');

var UserRoles = sequelize.define('userRoles', {});
var UserPermissions = sequelize.define('userPermissions', {});



module.exports = {

    attributes: {
        username: {
            type: Sequelize.TEXT,
            index: true,
            allowNull: false,
            validate: {
                min: 5,
            }
        },
        email: {
            type: Sequelize.TEXT,
            index: true,
            allowNull: false,
            validate: {
                isEmail: true,
            }
        },
        settings: {
            type: Sequelize.JSONB
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
            as: 'passports',
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
        User.hasMany(ApiCredential, {
            as: 'apiCredentials',
            foreignKey: 'ownerId'
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
            },
            getOrganisationInfo: function(id){
                return sequelize.query("select get_user_organisation_info_json(:id)",
                               { type: sequelize.QueryTypes.SELECT,
                                    replacements:{id: id}})
                                    .then(r => r[0].get_user_organisation_info_json)
                },

            recentActivity: function(id){
                return ActivityLog.query(id);
            },
            permissions: function(id){
                return PermissionService.getPermissions(id, 'Company')
                    .then(permissions => ({company: permissions}))
            },
        },
        instanceMethods: {
            toJSON: function() {
                var user = this.get();
                delete user.password;
                return user;
            },
            getOrganisation: function(){
                return sequelize.query("select get_user_organisation(:id)",
                               { type: sequelize.QueryTypes.SELECT,
                                    replacements:{id: this.id}})
                                    .then(r => r[0].get_user_organisation)
            },
            getPrincipals: function(){
                return sequelize.query("select get_user_principals(:id)",
                               { type: sequelize.QueryTypes.SELECT,
                                    replacements:{id: this.id}})
                                    .then(r => r.map(r => r.get_user_princials))
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
                        if(!user.roles || !user.roles.length){
                            return Role.findOne({where: {
                                name: 'registered'
                            }})
                            .then(function(role) {
                                return user.addRole(role)
                            })
                            .then(function(updatedUser) {
                                sails.log.verbose('role "registered" attached to user', user.username);
                            })
                        }
                    })
                    .catch(function(e) {
                        sails.log.error(e);
                    })
                }
            ]

        }
    }

}
