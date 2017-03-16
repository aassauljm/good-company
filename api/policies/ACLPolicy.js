
module.exports = function ACLPolicy (req, res, next) {
    var permission = req.options.method ||  PermissionService.getMethod(req.method);
    var entityId = req.params.id || null;
    var modelIdentity = req.options.modelIdentity;
    var userId = req.user.id;
    return PermissionService.isAllowed({id: entityId}, req.user, permission, modelIdentity)
            .then(allow => {
                if(!allow){
                    return res.forbidden();
                }
                next();
            })

};