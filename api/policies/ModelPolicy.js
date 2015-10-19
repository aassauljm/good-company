var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');
var _ = require('lodash');

/**
 * Query the Model that is being acted upon, and set it on the req object.
 */
module.exports = function ModelPolicy(req, res, next) {
    req.options.modelIdentity = actionUtil.parseModel(req).name;
    if (_.isEmpty(req.options.modelIdentity)) {
        return next();
    }
    PermissionService.getModel(req.options.modelIdentity)
        .then(function(model){
            req.options.modelDefinition = sails.models[req.options.modelIdentity];
            req.model = model;
            next();
        })
        .catch(next);
};