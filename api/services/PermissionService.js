var Promise = require('bluebird');


var methodMap = {
    POST: 'create',
    GET: 'read',
    PUT: 'update',
    DELETE: 'delete'
};

module.exports = {

    getMethod: function(method) {
        return methodMap[method];
    },
    isAllowed: function(model, user, permission, modelIdentity){
        const entityId = model ? model.id : null;
        const userId = user.id;
        return sequelize.query("select check_permission(:userId, :permission, :modelIdentity, :entityId)",
                { type: sequelize.QueryTypes.SELECT,
                    replacements: { userId, permission, modelIdentity, entityId }
                })
                .then(r => r[0].check_permission)
    },
    getPermissions: function(userId, modelIdentity, entityId = null){
        return sequelize.query("select get_permissions(:userId, :modelIdentity, :entityId)",
                { type: sequelize.QueryTypes.SELECT,
                    replacements: { userId, modelIdentity, entityId }
                })
            .then(r => r.map(r => r.get_permissions))
    },
    getCatalexUserPermissions: function(catalexId, modelIdentity, entityId = null){
        return sequelize.query("select get_permissions_catalex_user(:catalexId, :modelIdentity, :entityId)",
                { type: sequelize.QueryTypes.SELECT,
                    replacements: { catalexId, modelIdentity, entityId }
                })
            .then(r => r.map(r => r.get_permissions_catalex_user))
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
    addPermissionUser: function(user, model, permission, allow, userDefined = false){
        const entityId = typeof model !== 'string' ? model.id : null;
        const modelId = sails.hooks['sails-permissions']._modelCache[typeof model !== 'string' ? model.$modelOptions.name.singular : model].id;
        return Permission.create({
            userId: user.id, modelId, action: permission, relation: 'user', entityId, allow, userDefined
        })
    },
    addPermissionCatalexUser: function(catalexId, model, permission, allow, userDefined = false){
        const entityId = typeof model !== 'string' ? model.id : null;
        const modelId = sails.hooks['sails-permissions']._modelCache[typeof model !== 'string' ? model.$modelOptions.name.singular : model].id;
        return Permission.create({
            catalexId,  modelId, action: permission, relation: 'catalex', entityId, allow, userDefined
        })
    },
    removePermissionUser: function(user, model, permission, allow, userDefined = false){
        const entityId = typeof model !== 'string' ? model.id : null;
        const modelId = sails.hooks['sails-permissions']._modelCache[typeof model !== 'string' ? model.$modelOptions.name.singular : model].id;
        return Permission.destroy({where: {
            userId: user.id, modelId, action: permission, relation: 'user', entityId: {$eq: typeof model !== 'string'  ? model.id : null}, allow, userDefined
        }})
    },
    removePermissionCatalexUser: function(catalexId, model, permission, allow, userDefined = false){
        const entityId = typeof model !== 'string' ? model.id : null;
        const modelId = sails.hooks['sails-permissions']._modelCache[typeof model !== 'string' ? model.$modelOptions.name.singular : model].id;
        return Permission.destroy({where: {
            catalexId, modelId, action: permission, relation: 'catalex', entityId: {$eq: typeof model !== 'string'  ? model.id : null}, allow, userDefined
        }})
    },
}
