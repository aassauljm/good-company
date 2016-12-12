/**
 * TODO - this is setting createdBy, not owner.
 * The comment below, and the name of this file/function is confusing to me
 * Ensure that the 'owner' property of an Object is set upon creation.
 */
module.exports = function AdminPolicy (req, res, next) {
    if(!sails.config.ADMIN_KEY || sails.config.ADMIN_KEY !== req.body.key){
        return res.forbidden();
    }
    next();
};
