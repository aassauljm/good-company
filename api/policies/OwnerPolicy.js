/**
 * TODO - this is setting createdBy, not owner.
 * The comment below, and the name of this file/function is confusing to me
 * Ensure that the 'owner' property of an Object is set upon creation.
 */
module.exports = function OwnerPolicy (req, res, next) {
  //sails.log('OwnerPolicy()');
  if (!req.user || !req.user.id) {
    req.logout();
    return res.send(500, new Error('req.user is not set'));
  }


  if ('POST' === req.method) {
    req.body || (req.body = { });
    req.body.createdById = req.user.id;
    req.body.ownerId = req.user.id;
    req.body.userId = req.user.id;
  }

  //sails.log.verbose('OwnerPolicy req.model', req.model);
  next();
};
