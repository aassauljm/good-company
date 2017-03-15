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
        console.log({ userId, permission, modelIdentity, entityId })
        return sequelize.query("select check_permission(:userId, :permission, :modelIdentity, :entityId)",
                { type: sequelize.QueryTypes.SELECT,
                    replacements: { userId, permission, modelIdentity, entityId }
                })
                .then(r => r[0].check_permission)
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
}
