var Promise = require('bluebird');
var _ = require('lodash');
var methodMap = {
    POST: 'create',
    GET: 'read',
    PUT: 'update',
    DELETE: 'delete'
};

var findRecords = require('sails-hook-sequelize-blueprints/actions/find');

var wlFilter = require('waterline-criteria');


function formatCriteriaQuery(permission, criteria, user){
    // ensure criteria.where is initialized
    criteria.where = criteria.where || {};
    if (permission.relation == 'owner') {
      criteria.where.ownerId = user.id;
    }
    if (permission.relation == 'user') {
      criteria.where.userId = req.user.id;
    }

    if (permission.relation == 'organisation') {
      criteria.where.organisationId = user.getOrganisation()
    }

    if (permission.entityId) {
      criteria.where.id= req.user.permission.entityId;
    }

    return criteria;
}

module.exports = {
    formatCriteriaQuery: formatCriteriaQuery,
    /**
     * Given an object, or a list of objects, return true if the list contains
     * objects not owned by the specified user.
     */
    hasForeignObjects: function(objects, user) {
        if (!_.isArray(objects)) {
            return PermissionService.isForeignObject(user.id)(objects);
        }
        return _.any(objects, PermissionService.isForeignObject(user.id));
    },

    /**
     * Return whether the specified object is NOT owned by the specified user.
     */
    isForeignObject: function(ownerId) {
        return function(object) {
            //sails.log.verbose('object', object);
            //sails.log.verbose('object.owner: ', object.owner, ', owner:', owner);
            return object.ownerId !== ownerId;
        };
    },

    /**
     * Find objects that some arbitrary action would be performed on, given the
     * same request.
     *
     * @param options.model
     * @param options.query
     *
     * TODO this will be less expensive when waterline supports a caching layer
     */
    findTargetObjects: function(req) {


        // handle add/remove routes that have :parentid as the primary key field
        var originalId;
        if (req.params.parentid) {
            originalId = req.params.id;
            req.params.id = req.params.parentid;
        }

        return new Promise(function(resolve, reject) {
                findRecords(req, {
                    ok: resolve,
                    serverError: reject,
                    // this isn't perfect, since it returns a 500 error instead of a 404 error
                    // but it is better than crashing the app when a record doesn't exist
                    notFound: reject
                });
            })
            .then(function(result) {
                if (originalId !== undefined) {
                    req.params.id = originalId;
                }
                return result;
            });
    },

    /**
     * Query Permissions that grant privileges to a role/user on an action for a
     * model.
     *
     * @param options.method
     * @param options.model
     * @param options.user
     */
    findModelPermissions: function(options) {
        var action = options.action || PermissionService.getMethod(options.method);
        var permissionCriteria = {
            model: options.model.id,
            action: action
        };
        return User.findOne({
                where: {
                    id: options.user.id
                },
                include: [{
                    model: Role,
                    as: 'roles'
                }]
            })
            .then(function(user) {
                return Permission.findAll({
                    where: {
                        modelId: options.model.id,
                        action: action,
                        $or: [{
                            userId: user.id
                        }, {
                            roleId: _.pluck(user.roles, 'id')
                        }]
                    },
                    include: [{
                        model: Criteria
                    }]
                })
            })
    },

    /**
     * Given a list of objects, determine if they all satisfy at least one permission's
     * where clause/attribute blacklist combination
     *
     * @param {Array of objects} objects - The result of the query, or if the action is create,
     * the body of the object to be created
     * @param {Array of Permission objects} permissions - An array of permission objects
     * that are relevant to this particular user query
     * @param {Object} attributes - The body of the request, in an update or create request.
     * The keys of this object are checked against the permissions blacklist
     * @returns boolean - True if there is at least one granted permission that allows the requested action,
     * otherwise false
     */
    hasPassingCriteria: function(objects, permissions, attributes, userId) {
        // return success if there are no permissions or objects

        if (_.isEmpty(permissions) || _.isEmpty(objects)) return true;

        if (!_.isArray(objects)) {
            objects = [objects];
        }

        var criteria = permissions.reduce(function(memo, perm) {
            if (perm) {
                if (!perm.criteria || perm.criteria.length == 0) {
                    // If a permission has no criteria then it passes for all cases
                    // (like the admin role)
                    memo = memo.concat([{
                        where: {},
                        allow: perm.allow
                    }]);
                } else {
                    if(!Array.isArray(perm.criteria)){
                        memo = memo.concat({...perm.criteria, allow: perm.allow});
                    }
                    else{
                        memo = memo.concat(perm.criteria.map(c => ({...c, allow: perm.allow})));
                    }
                }
                if (perm.relation === 'owner') {
                    perm.criteria.forEach(function(criteria) {
                        criteria.owner = true;
                    });
                }
                return memo;
            }
        }, []);
        console.log(criteria)
        if (!_.isArray(criteria)) {
            criteria = [criteria];
        }

        if (_.isEmpty(criteria)) {
            return true;
        }
        // every object must have at least one permission that has a passing criteria and a passing attribute check
        return objects.every(function(obj) {
            const some = criteria.some(function(criteria) {
                var match = wlFilter([typeof obj.get === 'function' ? obj.get() : obj], {
                    where: criteria.where
                }).results;
                if(!criteria.allow){
                    return false;
                }
                var hasUnpermittedAttributes = PermissionService.hasUnpermittedAttributes(attributes, criteria.blacklist);
                var hasOwnership = true; // edge case for scenario where a user has some permissions that are owner based and some that are role based
                if (criteria.owner) {
                    hasOwnership = !PermissionService.isForeignObject(userId)(obj);
                }
                return match.length === 1 && !hasUnpermittedAttributes && hasOwnership;
            });
            return some;
        });

    },

    hasUnpermittedAttributes: function(attributes, blacklist) {
        if (_.isEmpty(attributes) || _.isEmpty(blacklist)) {
            return false;
        }
        return _.intersection(Object.keys(attributes), blacklist).length ? true : false;
    },

    /**
     * Return true if the specified model supports the ownership policy; false
     * otherwise.
     */
    hasOwnershipPolicy: function(model) {
        return !!(model.associations && model.associations.owner);
    },

    /**
     * Build an error message
     */
    getErrorMessage: function(options) {
        return [
            'User', options.user.email, 'is not permitted to', options.method, options.model.name
        ].join(' ');
    },

    /**
     * Given an action, return the CRUD method it maps to.
     */
    getMethod: function(method) {
        return methodMap[method];
    },

    /**
     * create a new role
     * @param options
     * @param options.name {string} - role name
     * @param options.permissions {permission object, or array of permissions objects}
     * @param options.permissions.model {string} - the name of the model that the permission is associated with
     * @param options.permissions.criteria - optional criteria object
     * @param options.permissions.criteria.where - optional waterline query syntax object for specifying permissions
     * @param options.permissions.criteria.blacklist {string array} - optional attribute blacklist
     * @param options.users {array of user names} - optional array of user ids that have this role
     */
    createRole: function(options) {

        var ok = Promise.resolve();
        var permissions = options.permissions;

        if (!_.isArray(permissions)) {
            permissions = [permissions];
        }


        // look up the model id based on the model name for each permission, and change it to an id
        ok = ok.then(function() {
            return Promise.map(permissions, function(permission) {
                return Model.findOne({
                        where: {
                            name: permission.model
                        }
                    })
                    .then(function(model) {
                        permission.modelId = model.id;
                        return permission;
                    });
            });
        });

        // look up user ids based on usernames, and replace the names with ids
        ok = ok.then(function(permissions) {
            if (options.users) {
                return User.findAll({
                        where: {
                            username: options.users
                        }
                    })
                    .then(function(users) {
                        options.users = users;
                    });
            }
        });

        ok = ok.then(function(users) {
            return Role.create(options);
        });

        return ok;
    },

    /**
     *
     * @param options {permission object, or array of permissions objects}
     * @param options.role {string} - the role name that the permission is associated with,
     *                                either this or user should be supplied, but not both
     * @param options.user {string} - the user than that the permission is associated with,
     *                                either this or role should be supplied, but not both
     * @param options.model {string} - the model name that the permission is associated with
     * @param options.action {string} - the http action that the permission allows
     * @param options.criteria - optional criteria object
     * @param options.criteria.where - optional waterline query syntax object for specifying permissions
     * @param options.criteria.blacklist {string array} - optional attribute blacklist
     */
    grant: function(permissions) {
        if (!_.isArray(permissions)) {
            permissions = [permissions];
        }

        // look up the models based on name, and replace them with ids
        var ok = Promise.map(permissions, function(permission) {
            var findRole = permission.role ? Role.findOne({
                where: {
                    name: permission.role
                }
            }) : null;
            var findUser = permission.user ? User.findOne({
                where: {
                    username: permission.user
                }
            }) : null;
            return Promise.all([findRole, findUser, Model.findOne({
                    where: {
                        name: permission.model
                    }
                })])
                .spread(function(role, user, model) {
                    permission.modelId = model.id;
                    if (role && role.id) {
                        permission.roleId = role.id;
                    } else if (user && user.id) {
                        permission.userId = user.id;
                    } else {
                        return Promise.reject(new Error('no role or user specified'));
                    }
                });
        });

        ok = ok.then(function() {
            return Permission.bulkCreate(permissions);
        });

        return ok;
    },

    /**
     * add one or more users to a particular role
     * TODO should this work with multiple roles?
     * @param usernames {string or string array} - list of names of users
     * @param rolename {string} - the name of the role that the users should be added to
     */
    addUsersToRole: function(usernames, rolename) {
        if (_.isEmpty(usernames)) {
            return Promise.reject(new Error('One or more usernames must be provided'));
        }

        if (!_.isArray(usernames)) {
            usernames = [usernames];
        }
        var role;
        return Role.findOne({
            where: {
                name: rolename
            }, include: [{model: User, as: 'users'}]})
            .then(function(_role) {
                role = _role;
            return User.findAll({
                where: {
                    username: usernames
                }
            }).then(function(users) {
                return role.setUsers(role.users.concat(users));
            })
            .then(function(){
                return role.reload();
            })
        });
    },

    /**
     * remove one or more users from a particular role
     * TODO should this work with multiple roles
     * @params usernames {string or string array} - name or list of names of users
     * @params rolename {string} - the name of the role that the users should be removed from
     */
    removeUsersFromRole: function(usernames, rolename) {
        if (_.isEmpty(usernames)) {
            return Promise.reject(new Error('One or more usernames must be provided'));
        }

        if (!_.isArray(usernames)) {
            usernames = [usernames];
        }
        var role;
        return Role.findOne({where: {
                name: rolename
            }, include: [{model: User, as: 'users'}]})
            .then(function(_role) {
                role = _role;
                return role.setUsers(_.filter(role.users, function(user){
                    return !_.contains(usernames, user.username);
                }));
            })
            .then(function(){
                return role.reload();
            })
    },

    /**
     * revoke permission from role
     * @param options
     * @param options.role {string} - the name of the role related to the permission.  This, or options.user should be set, but not both.
     * @param options.user {string} - the name of the user related to the permission.  This, or options.role should be set, but not both.
     * @param options.model {string} - the name of the model for the permission
     * @param options.action {string} - the name of the action for the permission
     * @param options.relation {string} - the type of the relation (owner or role)
     */
    revoke: function(options) {
        var findRole = options.role ? Role.findOne({ where: {
            name: options.role
        }
        }) : null;
        var findUser = options.user ? User.findOne({ where: {
            username: options.user
        }
        }) : null;
        var ok = Promise.all([findRole, findUser, Model.findOne({ where: {
            name: options.model
        }
        })]);

        ok = ok.spread(function(role, user, model) {

            var query = {
                modelId: model.id,
                action: options.action,
                relation: options.relation
            };

            if (role && role.id) {
                query.roleId = role.id;
            } else if (user && user.id) {
                query.userId = user.id;
            } else {
                return Promise.reject(new Error('You must provide either a user or role to revoke the permission from'));
            }
            return Permission.destroy({
                where: query
            })
        });

        return ok;
    },

    /**
     * Check if the user (out of role) is granted to perform action on given objects
     * @param objects
     * @param user
     * @param action
     * @param model
     * @param body
     * @returns {*}
     */
    isAllowedToPerformAction: function(objects, user, action, model, body) {
        if (!_.isArray(objects)) {
            return PermissionService.isAllowedToPerformSingle(user.id, action, model, body)(objects);
        }
        return new Promise.map(objects, PermissionService.isAllowedToPerformSingle(user.id, action, model, body))
            .then(function(allowedArray) {
                return allowedArray.every(function(allowed) {
                    return allowed === true;
                });
            });
    },

    /**
     * Resolve if the user have the permission to perform this action
     * @param user
     * @param action
     * @param model
     * @param body
     * @returns {Function}
     */
    isAllowedToPerformSingle: function(user, action, model, body) {
        return function(obj) {
            return new Promise(function(resolve, reject) {
                Model.findOne({
                    identity: model
                }).then(function(model) {
                    return Permission.find({
                        where: {
                            modelId: model.id,
                            action: action,
                            relation: 'user',
                            userId: userId
                        },
                        include: [{
                            model: Criteria
                        }]
                    })
                }).then(function(permission) {
                    if (permission.length > 0 && PermissionService.hasPassingCriteria(obj, permission, body)) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }).catch(reject);
            });
        };
    },

    getModel: Promise.method(function(modelIdentity) {
        var modelCache = sails.hooks['sails-permissions']._modelCache;
        if (_.isEmpty(modelIdentity)) {
            return
        }

        var modelDefinition = sails.models[modelIdentity];
        var model = modelCache[modelIdentity];

        if (_.isObject(model) && !_.isNull(model.id)) {
            return model;
        }

        sails.log.warn('Model [', modelIdentity, '] not found in model cache');

        // if the model is not found in the cache for some reason, get it from the database
        return Model.findOne({
                where: {
                    identity: modelIdentity
                }
            })
            .then(function(model) {
                if (!_.isObject(model)) {
                    if (!sails.config.permissions.allowUnknownModelDefinition) {
                        return next(new Error('Model definition not found: ' + modelIdentity));
                    } else {
                        model = sails.models[modelIdentity];
                    }
                }

                return model;
            })
    }),


    isAllowed: function(objects, user, action, modelIdentity){
       return PermissionService.getModel(modelIdentity)
            .then(function(model){
                return PermissionService.findModelPermissions({model: model, action: action, user: user})
            })
            .then(function(permissions){
                var criteria = _.compact(_.flatten(
                    _.map(permissions, function(permission) {
                      if (_.isEmpty(permission.criteria)) {
                        permission.criteria = [{
                          where: {}
                        }];
                      }
                      var criteriaList = permission.criteria;
                      return _.map(criteriaList, (criteria) => formatCriteriaQuery(permission, criteria, user));
                    })
                  ));
                return permissions;
            })
            .then(function(permissions){
                return PermissionService.hasPassingCriteria(objects, permissions, null, user.id);
            })
            .then(function(pass){
                if(!pass){
                    throw new sails.config.exceptions.ForbiddenException('Not Permitted')
                }
            })

    }
};